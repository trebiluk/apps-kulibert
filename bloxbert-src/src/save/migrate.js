// Save schema. A doc with no schema counts as 2. Newer than SCHEMA is read-only.
import { FROZEN } from '../data/ids.js'
import { exploredSeen } from '../worldgen.js'

export const SCHEMA = 6
const MISSING = FROZEN.missing
const RUNTIME_LO = 1001
const RUNTIME_HI = 1099

const byName = new Map()
const byId = new Map()
const retired = new Set()

export function resetUnknown() {
  byName.clear()
  byId.clear()
}

export function unknownEntries() {
  return [...byId.entries()]
}

export function isMissingId(id) {
  return id === MISSING || (id >= RUNTIME_LO && id <= RUNTIME_HI)
}

export function claimUnknown(name) {
  if (byName.has(name)) return byName.get(name)
  const used = new Set(byName.values())
  for (let id = RUNTIME_LO; id <= RUNTIME_HI; id++) {
    if (used.has(id)) continue
    byName.set(name, id)
    byId.set(id, name)
    return id
  }
  return MISSING
}

// Gzip inflate for the one-time town cleanup. Stored-block gzip goes back out.
// inflate: tiny-inflate (MIT), Devon Govett.
var TINF_OK = 0;
var TINF_DATA_ERROR = -3;

function Tree() {
  this.table = new Uint16Array(16);   /* table of code length counts */
  this.trans = new Uint16Array(288);  /* code -> symbol translation table */
}

function Data(source, dest) {
  this.source = source;
  this.sourceIndex = 0;
  this.tag = 0;
  this.bitcount = 0;
  
  this.dest = dest;
  this.destLen = 0;
  
  this.ltree = new Tree();  /* dynamic length/symbol tree */
  this.dtree = new Tree();  /* dynamic distance tree */
}

/* --------------------------------------------------- *
 * -- uninitialized global data (static structures) -- *
 * --------------------------------------------------- */

var sltree = new Tree();
var sdtree = new Tree();

/* extra bits and base tables for length codes */
var length_bits = new Uint8Array(30);
var length_base = new Uint16Array(30);

/* extra bits and base tables for distance codes */
var dist_bits = new Uint8Array(30);
var dist_base = new Uint16Array(30);

/* special ordering of code length codes */
var clcidx = new Uint8Array([
  16, 17, 18, 0, 8, 7, 9, 6,
  10, 5, 11, 4, 12, 3, 13, 2,
  14, 1, 15
]);

/* used by tinf_decode_trees, avoids allocations every call */
var code_tree = new Tree();
var lengths = new Uint8Array(288 + 32);

/* ----------------------- *
 * -- utility functions -- *
 * ----------------------- */

/* build extra bits and base tables */
function tinf_build_bits_base(bits, base, delta, first) {
  var i, sum;

  /* build bits table */
  for (i = 0; i < delta; ++i) bits[i] = 0;
  for (i = 0; i < 30 - delta; ++i) bits[i + delta] = i / delta | 0;

  /* build base table */
  for (sum = first, i = 0; i < 30; ++i) {
    base[i] = sum;
    sum += 1 << bits[i];
  }
}

/* build the fixed huffman trees */
function tinf_build_fixed_trees(lt, dt) {
  var i;

  /* build fixed length tree */
  for (i = 0; i < 7; ++i) lt.table[i] = 0;

  lt.table[7] = 24;
  lt.table[8] = 152;
  lt.table[9] = 112;

  for (i = 0; i < 24; ++i) lt.trans[i] = 256 + i;
  for (i = 0; i < 144; ++i) lt.trans[24 + i] = i;
  for (i = 0; i < 8; ++i) lt.trans[24 + 144 + i] = 280 + i;
  for (i = 0; i < 112; ++i) lt.trans[24 + 144 + 8 + i] = 144 + i;

  /* build fixed distance tree */
  for (i = 0; i < 5; ++i) dt.table[i] = 0;

  dt.table[5] = 32;

  for (i = 0; i < 32; ++i) dt.trans[i] = i;
}

/* given an array of code lengths, build a tree */
var offs = new Uint16Array(16);

function tinf_build_tree(t, lengths, off, num) {
  var i, sum;

  /* clear code length count table */
  for (i = 0; i < 16; ++i) t.table[i] = 0;

  /* scan symbol lengths, and sum code length counts */
  for (i = 0; i < num; ++i) t.table[lengths[off + i]]++;

  t.table[0] = 0;

  /* compute offset table for distribution sort */
  for (sum = 0, i = 0; i < 16; ++i) {
    offs[i] = sum;
    sum += t.table[i];
  }

  /* create code->symbol translation table (symbols sorted by code) */
  for (i = 0; i < num; ++i) {
    if (lengths[off + i]) t.trans[offs[lengths[off + i]]++] = i;
  }
}

/* ---------------------- *
 * -- decode functions -- *
 * ---------------------- */

/* get one bit from source stream */
function tinf_getbit(d) {
  /* check if tag is empty */
  if (!d.bitcount--) {
    /* load next tag */
    d.tag = d.source[d.sourceIndex++];
    d.bitcount = 7;
  }

  /* shift bit out of tag */
  var bit = d.tag & 1;
  d.tag >>>= 1;

  return bit;
}

/* read a num bit value from a stream and add base */
function tinf_read_bits(d, num, base) {
  if (!num)
    return base;

  while (d.bitcount < 24) {
    d.tag |= d.source[d.sourceIndex++] << d.bitcount;
    d.bitcount += 8;
  }

  var val = d.tag & (0xffff >>> (16 - num));
  d.tag >>>= num;
  d.bitcount -= num;
  return val + base;
}

/* given a data stream and a tree, decode a symbol */
function tinf_decode_symbol(d, t) {
  while (d.bitcount < 24) {
    d.tag |= d.source[d.sourceIndex++] << d.bitcount;
    d.bitcount += 8;
  }
  
  var sum = 0, cur = 0, len = 0;
  var tag = d.tag;

  /* get more bits while code value is above sum */
  do {
    cur = 2 * cur + (tag & 1);
    tag >>>= 1;
    ++len;

    sum += t.table[len];
    cur -= t.table[len];
  } while (cur >= 0);
  
  d.tag = tag;
  d.bitcount -= len;

  return t.trans[sum + cur];
}

/* given a data stream, decode dynamic trees from it */
function tinf_decode_trees(d, lt, dt) {
  var hlit, hdist, hclen;
  var i, num, length;

  /* get 5 bits HLIT (257-286) */
  hlit = tinf_read_bits(d, 5, 257);

  /* get 5 bits HDIST (1-32) */
  hdist = tinf_read_bits(d, 5, 1);

  /* get 4 bits HCLEN (4-19) */
  hclen = tinf_read_bits(d, 4, 4);

  for (i = 0; i < 19; ++i) lengths[i] = 0;

  /* read code lengths for code length alphabet */
  for (i = 0; i < hclen; ++i) {
    /* get 3 bits code length (0-7) */
    var clen = tinf_read_bits(d, 3, 0);
    lengths[clcidx[i]] = clen;
  }

  /* build code length tree */
  tinf_build_tree(code_tree, lengths, 0, 19);

  /* decode code lengths for the dynamic trees */
  for (num = 0; num < hlit + hdist;) {
    var sym = tinf_decode_symbol(d, code_tree);

    switch (sym) {
      case 16:
        /* copy previous code length 3-6 times (read 2 bits) */
        var prev = lengths[num - 1];
        for (length = tinf_read_bits(d, 2, 3); length; --length) {
          lengths[num++] = prev;
        }
        break;
      case 17:
        /* repeat code length 0 for 3-10 times (read 3 bits) */
        for (length = tinf_read_bits(d, 3, 3); length; --length) {
          lengths[num++] = 0;
        }
        break;
      case 18:
        /* repeat code length 0 for 11-138 times (read 7 bits) */
        for (length = tinf_read_bits(d, 7, 11); length; --length) {
          lengths[num++] = 0;
        }
        break;
      default:
        /* values 0-15 represent the actual code lengths */
        lengths[num++] = sym;
        break;
    }
  }

  /* build dynamic trees */
  tinf_build_tree(lt, lengths, 0, hlit);
  tinf_build_tree(dt, lengths, hlit, hdist);
}

/* ----------------------------- *
 * -- block inflate functions -- *
 * ----------------------------- */

/* given a stream and two trees, inflate a block of data */
function tinf_inflate_block_data(d, lt, dt) {
  while (1) {
    var sym = tinf_decode_symbol(d, lt);

    /* check for end of block */
    if (sym === 256) {
      return TINF_OK;
    }

    if (sym < 256) {
      d.dest[d.destLen++] = sym;
    } else {
      var length, dist, offs;
      var i;

      sym -= 257;

      /* possibly get more bits from length code */
      length = tinf_read_bits(d, length_bits[sym], length_base[sym]);

      dist = tinf_decode_symbol(d, dt);

      /* possibly get more bits from distance code */
      offs = d.destLen - tinf_read_bits(d, dist_bits[dist], dist_base[dist]);

      /* copy match */
      for (i = offs; i < offs + length; ++i) {
        d.dest[d.destLen++] = d.dest[i];
      }
    }
  }
}

/* inflate an uncompressed block of data */
function tinf_inflate_uncompressed_block(d) {
  var length, invlength;
  var i;
  
  /* unread from bitbuffer */
  while (d.bitcount > 8) {
    d.sourceIndex--;
    d.bitcount -= 8;
  }

  /* get length */
  length = d.source[d.sourceIndex + 1];
  length = 256 * length + d.source[d.sourceIndex];

  /* get one's complement of length */
  invlength = d.source[d.sourceIndex + 3];
  invlength = 256 * invlength + d.source[d.sourceIndex + 2];

  /* check length */
  if (length !== (~invlength & 0x0000ffff))
    return TINF_DATA_ERROR;

  d.sourceIndex += 4;

  /* copy block */
  for (i = length; i; --i)
    d.dest[d.destLen++] = d.source[d.sourceIndex++];

  /* make sure we start next block on a byte boundary */
  d.bitcount = 0;

  return TINF_OK;
}

/* inflate stream from source to dest */
function tinf_uncompress(source, dest) {
  var d = new Data(source, dest);
  var bfinal, btype, res;

  do {
    /* read final block flag */
    bfinal = tinf_getbit(d);

    /* read block type (2 bits) */
    btype = tinf_read_bits(d, 2, 0);

    /* decompress block */
    switch (btype) {
      case 0:
        /* decompress uncompressed block */
        res = tinf_inflate_uncompressed_block(d);
        break;
      case 1:
        /* decompress block with fixed huffman trees */
        res = tinf_inflate_block_data(d, sltree, sdtree);
        break;
      case 2:
        /* decompress block with dynamic huffman trees */
        tinf_decode_trees(d, d.ltree, d.dtree);
        res = tinf_inflate_block_data(d, d.ltree, d.dtree);
        break;
      default:
        res = TINF_DATA_ERROR;
    }

    if (res !== TINF_OK)
      throw new Error('Data error');

  } while (!bfinal);

  if (d.destLen < d.dest.length) {
    if (typeof d.dest.slice === 'function')
      return d.dest.slice(0, d.destLen);
    else
      return d.dest.subarray(0, d.destLen);
  }
  
  return d.dest;
}

/* -------------------- *
 * -- initialization -- *
 * -------------------- */

/* build fixed huffman trees */
tinf_build_fixed_trees(sltree, sdtree);

/* build extra bits and base tables */
tinf_build_bits_base(length_bits, length_base, 4, 3);
tinf_build_bits_base(dist_bits, dist_base, 2, 1);

/* fix a special case */
length_bits[28] = 0;
length_base[28] = 258;


const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c >>> 0
  }
  return t
})()

function crc32(u8) {
  let c = 0xffffffff
  for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function b64ToU8(b64) {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b64, 'base64'))
  const bin = atob(b64)
  const u8 = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
  return u8
}

function u8ToB64(u8) {
  if (typeof Buffer !== 'undefined') return Buffer.from(u8).toString('base64')
  let bin = ''
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + 0x8000, u8.length)))
  return btoa(bin)
}

function gunzipU8(u8) {
  if (!u8 || u8.length < 18 || u8[0] !== 0x1f || u8[1] !== 0x8b || u8[2] !== 8) throw new Error('gzip')
  const flg = u8[3]
  let i = 10
  if (flg & 4) {
    const xlen = u8[i] | (u8[i + 1] << 8)
    i += 2 + xlen
  }
  if (flg & 8) { while (u8[i]) i++; i++ }
  if (flg & 16) { while (u8[i]) i++; i++ }
  if (flg & 2) i += 2
  const isize = (u8[u8.length - 4] | (u8[u8.length - 3] << 8) | (u8[u8.length - 2] << 16) | (u8[u8.length - 1] << 24)) >>> 0
  const dest = new Uint8Array(isize)
  tinf_uncompress(u8.subarray(i, u8.length - 8), dest)
  return dest
}

function gzipStore(u8) {
  const parts = []
  let off = 0
  let body = 0
  while (off < u8.length) {
    const n = Math.min(65535, u8.length - off)
    const last = off + n >= u8.length
    const block = new Uint8Array(5 + n)
    block[0] = last ? 1 : 0
    block[1] = n & 255
    block[2] = (n >> 8) & 255
    const inv = (~n) & 0xffff
    block[3] = inv & 255
    block[4] = (inv >> 8) & 255
    block.set(u8.subarray(off, off + n), 5)
    parts.push(block)
    body += block.length
    off += n
  }
  const out = new Uint8Array(10 + body + 8)
  out.set([0x1f, 0x8b, 0x08, 0, 0, 0, 0, 0, 0, 0xff], 0)
  let p = 10
  for (let i = 0; i < parts.length; i++) { out.set(parts[i], p); p += parts[i].length }
  const c = crc32(u8)
  out[p] = c & 255
  out[p + 1] = (c >>> 8) & 255
  out[p + 2] = (c >>> 16) & 255
  out[p + 3] = (c >>> 24) & 255
  const sz = u8.length >>> 0
  out[p + 4] = sz & 255
  out[p + 5] = (sz >>> 8) & 255
  out[p + 6] = (sz >>> 16) & 255
  out[p + 7] = (sz >>> 24) & 255
  return out
}

const TOWN_DUP = [
  [6, 5, 8, 'workbench'],
  [8, 5, 9, 'storeCounter'],
  [10, 5, 6, 'bunk'],
  [11, 5, 8, 'oven'],
]

function rawIsStation(palette, raw, name) {
  const id = FROZEN[name]
  if (raw !== id) return false
  if (!palette || !palette.length) return true
  const listed = raw < palette.length ? palette[raw] : null
  return listed == null || listed === name
}

function rawAir(palette, raw) {
  if (!raw) return true
  if (!palette || raw >= palette.length) return false
  const listed = palette[raw]
  return listed == null || listed === 'air'
}

// Drop the four floating town stations from chunk 0,0,0. Returns how many cells changed.
export function clearTownDup(doc) {
  if (!doc || doc.townDupFixed) return 0
  const chunks = doc.chunks
  const blob = chunks && chunks['0,0,0']
  if (typeof blob !== 'string') return 0
  const S = (doc.chunkSize | 0) || 24
  let u16
  try {
    const bytes = gunzipU8(b64ToU8(blob))
    if (bytes.byteLength !== S * S * S * 2) return 0
    u16 = new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2)
  } catch (e) {
    return 0
  }
  const palette = doc.palette
  const next = new Uint16Array(u16)
  let n = 0
  for (let s = 0; s < TOWN_DUP.length; s++) {
    const x = TOWN_DUP[s][0]
    const y = TOWN_DUP[s][1]
    const z = TOWN_DUP[s][2]
    const name = TOWN_DUP[s][3]
    if (x < 0 || z < 0 || y < 1 || x >= S || y >= S || z >= S) continue
    const key = x + ',' + y + ',' + z
    if (doc.meta && doc.meta[key]) continue
    if (doc.stations && doc.stations[key]) continue
    const i = x * S * S + y * S + z
    const below = x * S * S + (y - 1) * S + z
    if (!rawIsStation(palette, next[i], name)) continue
    if (!rawAir(palette, next[below])) continue
    next[i] = 0
    n++
  }
  if (!n) return 0
  const packed = new Uint8Array(next.buffer, next.byteOffset, next.byteLength)
  chunks['0,0,0'] = u8ToB64(gzipStore(packed))
  doc.townDupFixed = 1
  return n
}

export const MIGRATIONS = [
  { from: 2, to: 3, run(doc) {
    const packs = doc && doc.packs && typeof doc.packs === 'object' ? { ...doc.packs } : {}
    return { ...doc, schema: 3, packs }
  } },
  { from: 3, to: 4, run(doc) {
    const spawn = Array.isArray(doc.spawn) ? doc.spawn.slice() : null
    const pos = Array.isArray(doc.pos) ? doc.pos.slice() : spawn
    return {
      ...doc,
      schema: 4,
      pos,
      spawnSet: false,
      protect: { size: 'medium', center: null },
    }
  } },
  { from: 4, to: 5, run(doc) {
    const next = { ...doc, schema: 5 }
    if (doc && doc.genVersion != null) return next
    return { ...next, genVersion: 3, genSeen: exploredSeen(doc && doc.chunks, doc && doc.chunkSize) }
  } },
  { from: 5, to: 6, run(doc) {
    const next = { ...doc, schema: 6, chunks: doc && doc.chunks ? { ...doc.chunks } : doc && doc.chunks }
    clearTownDup(next)
    return next
  } },
]

export function schemaOf(doc) {
  if (!doc || doc.schema == null) return 2
  return doc.schema | 0
}

export function migrate(doc) {
  const schema = schemaOf(doc)
  if (schema > SCHEMA) return { doc, readOnly: true, schema }
  let cur = doc || {}
  let at = schema
  for (const step of MIGRATIONS) {
    if (step.from !== at || at >= SCHEMA) continue
    cur = step.run(cur)
    at = step.to
  }
  return { doc: cur, readOnly: false, schema: at }
}

export function migrateVoxels(palette, data, nameToId) {
  const names = palette && palette.length ? palette : null
  const gifts = []
  const out = data.slice()
  if (!names) return { data: out, gifts }
  const known = nameToId || {}
  for (let i = 0; i < out.length; i++) {
    const id = out[i]
    if (!id) { out[i] = 0; continue }
    const name = id < names.length ? names[id] : null
    if (!name || name === 'air') { out[i] = 0; continue }
    const now = known[name]
    if (now) out[i] = now
    else if (retired.has(name)) {
      out[i] = 0
      gifts.push(name)
    } else out[i] = claimUnknown(name)
  }
  return { data: out, gifts }
}

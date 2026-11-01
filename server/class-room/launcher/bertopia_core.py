"""Bertopia Home launcher, the part without a window (adults 18+, personal host).

Keeps the pieces up to date and runs the server:
  * Node   - uses the PC's Node when it is 22.13+ (22.5-22.12 with --experimental-sqlite); otherwise, or when the
             person asks for it, "Bertopia's own Node": the official Node 22 LTS from nodejs.org, SHA-256 checked,
             kept in a per-user folder and refreshed when a newer 22 LTS comes out. The PC's Node is never touched.
  * code   - git fetch, then `git pull --ff-only` only when no tracked file has local changes.
  * game   - install/build through server/class-room/tools/home-launch.mjs (--no-update --no-start), which only
             does work when the lock file or the game source changed.
  * server - starts host/home.mjs, reads the owner-page address from its output, stops it cleanly by writing
             "stop" on its stdin (the final save runs; Windows has no SIGTERM).
Standard library only. Works on Windows (the target) and Linux (where the checks run).
"""
import datetime, hashlib, io, json, os, platform, re, shutil, subprocess, sys, tarfile, threading, time, traceback, urllib.request, zipfile
from pathlib import Path

LAUNCHER_VERSION = '1.1.0'   # bump on every launcher change: a frozen .exe runs the repo's copy when it is newer

HERE = Path(__file__).resolve().parent
ROOM = HERE.parent                       # server/class-room (set_repo() moves all three)
REPO = ROOM.parent.parent
LAUNCH = ROOM / 'tools' / 'home-launch.mjs'

def find_repo(start):
    """the checkout that holds this launcher: start, or a folder above it, with server/class-room/tools/home-launch.mjs"""
    start = Path(start).resolve()
    for d in [start, *start.parents]:
        if (d / 'server' / 'class-room' / 'tools' / 'home-launch.mjs').exists(): return d
    return None

def version_tuple(v):
    return tuple(int(x) for x in re.findall(r'\d+', str(v or '0'))[:3]) or (0,)

def launcher_version_in(file):
    try: m = re.search(r"^LAUNCHER_VERSION = '([0-9.]+)'", Path(file).read_text('utf-8'), re.M)
    except OSError: return None
    return m.group(1) if m else None

def repo_launcher_version():
    """the launcher version in the repo right now (after a pull it can be newer than the one running)"""
    return launcher_version_in(ROOM / 'launcher' / 'bertopia_core.py')

def set_repo(path):
    """a frozen .exe runs from a temp folder: it tells the core where the repo is"""
    global REPO, ROOM, LAUNCH
    REPO = Path(path).resolve(); ROOM = REPO / 'server' / 'class-room'; LAUNCH = ROOM / 'tools' / 'home-launch.mjs'
WIN = sys.platform == 'win32'
DIST = os.environ.get('BT_NODE_DIST', 'https://nodejs.org/dist')      # tests point this at a local server
NODE_MAJOR = 22
NODE_MIN = (22, 13, 0)
FLAG_MIN = (22, 5, 0)
NO_WINDOW = 0x08000000 if WIN else 0     # CREATE_NO_WINDOW: no black console flashing up from the .pyw

# GitHub ssh:// dependencies (the noa engine) over HTTPS, for this process tree only (git 2.31+)
GIT_ENV = {'GIT_CONFIG_COUNT': '2', 'GIT_CONFIG_KEY_0': 'url.https://github.com/.insteadOf', 'GIT_CONFIG_VALUE_0': 'ssh://git@github.com/',
           'GIT_CONFIG_KEY_1': 'url.https://github.com/.insteadOf', 'GIT_CONFIG_VALUE_1': 'git@github.com:'}


def app_dir():
    base = os.environ.get('BT_APP_DIR') or (os.path.join(os.environ.get('LOCALAPPDATA') or os.path.expanduser(r'~\AppData\Local'), 'Bertopia') if WIN
                                            else os.path.join(os.environ.get('XDG_DATA_HOME') or os.path.expanduser('~/.local/share'), 'bertopia'))
    Path(base).mkdir(parents=True, exist_ok=True)
    return Path(base)


# ---------------------------------------------------------------- settings
DEFAULTS = {'auto_update': True, 'own_node': False, 'start_on_open': False, 'debug': False, 'follow_release': True}
RELEASE_BRANCH = 'bertopia-home'   # always points at the newest home-host part; the launcher follows it

def load_settings():
    try: s = json.loads((app_dir() / 'launcher.json').read_text('utf-8'))
    except Exception: s = {}
    return {k: (s[k] if isinstance(s.get(k), bool) else v) for k, v in DEFAULTS.items()}

def save_settings(s):
    (app_dir() / 'launcher.json').write_text(json.dumps({k: bool(s.get(k, v)) for k, v in DEFAULTS.items()}, indent=2), 'utf-8')


# ---------------------------------------------------------------- Node
def parse_version(v):
    m = re.match(r'^v?(\d+)\.(\d+)\.(\d+)', str(v or '').strip())
    return tuple(int(x) for x in m.groups()) if m else None

def node_fit(v):
    """'ok' (22.13+), 'flag' (22.5-22.12: needs --experimental-sqlite), 'old' or None (not a version)"""
    t = parse_version(v)
    if not t: return None
    if t >= NODE_MIN: return 'ok'
    if t >= FLAG_MIN and t[0] == NODE_MAJOR: return 'flag'
    return 'old'

def node_version(exe):
    try:
        r = subprocess.run([str(exe), '-v'], capture_output=True, text=True, timeout=15, creationflags=NO_WINDOW)
        return r.stdout.strip() if r.returncode == 0 else None
    except Exception:
        return None

def own_node_dirs():
    return sorted((d for d in app_dir().glob('node-v%d.*' % NODE_MAJOR) if own_node_exe(d).exists()), key=lambda d: parse_version(d.name[5:]) or (0,))

def own_node_exe(d):
    return Path(d) / ('node.exe' if WIN else 'bin/node')

def node_candidates():
    """[(path, label)] in the order a person would expect: their Node first, then the usual folders, then Bertopia's own"""
    out, seen = [], set()
    def add(p, label):
        if p and Path(p).exists():
            k = os.path.normcase(str(Path(p).resolve()))
            if k not in seen: seen.add(k); out.append((str(p), label))
    add(shutil.which('node'), 'this PC')
    if WIN:
        for env, sub in (('ProgramFiles', r'nodejs\node.exe'), ('LOCALAPPDATA', r'Programs\nodejs\node.exe'), ('NVM_SYMLINK', 'node.exe')):
            if os.environ.get(env): add(os.path.join(os.environ[env], sub), 'this PC')
    for d in reversed(own_node_dirs()): add(own_node_exe(d), "Bertopia's own")
    return out

def pick_node(prefer_own=False):
    """-> {'exe', 'version', 'fit', 'label'} for the best usable Node, or None"""
    found = []
    for exe, label in node_candidates():
        v = node_version(exe); fit = node_fit(v)
        if fit in ('ok', 'flag'): found.append({'exe': exe, 'version': v, 'fit': fit, 'label': label})
    if prefer_own:
        own = [n for n in found if n['label'] == "Bertopia's own"]
        if own: return own[0]
    ok = [n for n in found if n['fit'] == 'ok']
    return (ok or found or [None])[0]

def platform_key():
    return 'win-x64-zip' if WIN else 'linux-x64'

def latest_lts(index, major=NODE_MAJOR, key=None):
    key = key or platform_key()
    rows = [r for r in index if r.get('lts') and str(r.get('version', '')).startswith('v%d.' % major) and key in (r.get('files') or [])]
    rows.sort(key=lambda r: parse_version(r['version']) or (0,), reverse=True)
    return rows[0]['version'] if rows else None

def _get(url, timeout=120):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return r.read()

def ensure_own_node(log=print):
    """Bertopia's own Node: the newest official Node 22 LTS, checked and unpacked; older copies removed after.
    -> path of node(.exe). Raises with a plain reason on failure; nothing half-unpacked is left behind."""
    index = json.loads(_get(DIST + '/index.json', 30))
    v = latest_lts(index)
    if not v: raise RuntimeError('nodejs.org lists no Node %d LTS for this computer' % NODE_MAJOR)
    name = 'node-%s-%s' % (v, 'win-x64' if WIN else 'linux-x64')
    target = app_dir() / name
    if own_node_exe(target).exists():
        log("Bertopia's own Node %s is up to date." % v); return str(own_node_exe(target))
    arch = name + ('.zip' if WIN else '.tar.xz')
    sums = _get('%s/%s/SHASUMS256.txt' % (DIST, v), 30).decode('utf-8', 'replace')
    want = next((ln.split()[0] for ln in sums.splitlines() if ln.strip().endswith('  ' + arch)), None)
    if not want: raise RuntimeError('no checksum listed for ' + arch)
    log('Downloading the official Node %s (%s) ...' % (v, arch))
    data = _get('%s/%s/%s' % (DIST, v, arch), 600)
    if hashlib.sha256(data).hexdigest() != want: raise RuntimeError('checksum mismatch for %s: not unpacked' % arch)
    log('Checksum OK. Unpacking ...')
    tmp = app_dir() / ('.unpack-' + name)
    shutil.rmtree(tmp, ignore_errors=True); tmp.mkdir()
    try:
        if WIN:
            with zipfile.ZipFile(io.BytesIO(data)) as z:
                for m in z.namelist():
                    if m.startswith('/') or '..' in Path(m).parts: raise RuntimeError('unsafe path in ' + arch)
                z.extractall(tmp)
        else:
            with tarfile.open(fileobj=io.BytesIO(data), mode='r:xz') as t:
                t.extractall(tmp, filter='data')
        inner = tmp / name
        if not own_node_exe(inner).exists(): raise RuntimeError(arch + ' has no node in it')
        shutil.rmtree(target, ignore_errors=True); inner.rename(target)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    for d in own_node_dirs():
        if d.name != name: shutil.rmtree(d, ignore_errors=True)     # older copies of Bertopia's own Node only
    log("Bertopia's own Node %s is ready." % v)
    return str(own_node_exe(target))


# ---------------------------------------------------------------- code (git)
def git(args, cwd=None, timeout=120):
    try:
        r = subprocess.run(['git', *args], cwd=str(cwd or REPO), capture_output=True, text=True, timeout=timeout, env={**os.environ, **GIT_ENV}, creationflags=NO_WINDOW)
        return r.returncode, r.stdout.strip(), r.stderr.strip()
    except FileNotFoundError:
        return 127, '', 'git is not installed'
    except subprocess.TimeoutExpired:
        return 124, '', 'git took too long (network?)'

def code_status(fetch=True, cwd=None):
    """-> {'git', 'branch', 'upstream', 'behind', 'ahead', 'changed': [files], 'fetched', 'note'}"""
    rc, out, _ = git(['rev-parse', '--is-inside-work-tree'], cwd)
    if rc != 0 or out != 'true': return {'git': False, 'note': 'not a git checkout: updates are off'}
    st = {'git': True, 'branch': git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd)[1], 'upstream': None, 'behind': 0, 'ahead': 0, 'fetched': False}
    st['changed'] = [l for l in git(['diff', '--name-only', 'HEAD'], cwd)[1].splitlines() if l]
    rc, up, _ = git(['rev-parse', '--abbrev-ref', '@{u}'], cwd)
    if rc != 0: st['note'] = 'this branch tracks no remote: updates are off'; return st
    st['upstream'] = up
    if fetch:
        rc, _, err = git(['fetch', '--quiet'], cwd)
        st['fetched'] = rc == 0
        if rc != 0: st['note'] = 'could not check for updates (' + (err.splitlines()[-1] if err else 'offline?') + ')'
    rc, counts, _ = git(['rev-list', '--left-right', '--count', 'HEAD...@{u}'], cwd)
    if rc == 0 and counts:
        a, b = counts.split()[:2]; st['ahead'], st['behind'] = int(a), int(b)
    return st

def switch_to_release(cwd=None, branch=RELEASE_BRANCH):
    """Move the checkout onto the release branch (creating it to track origin/<branch> if needed). -> (ok, message)
    Only when no tracked file has local changes. Untracked files (the game build) come along untouched."""
    rc, cur, _ = git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd)
    if rc != 0: return False, 'not a git checkout'
    if cur == branch: return True, 'on ' + branch
    changed = [l for l in git(['diff', '--name-only', 'HEAD'], cwd)[1].splitlines() if l]
    if changed: return False, 'staying on %s: you have local changes (%s)' % (cur, ', '.join(changed[:3]))
    git(['fetch', '--quiet', 'origin', branch], cwd)
    if git(['rev-parse', '--verify', '--quiet', 'origin/' + branch], cwd)[0] != 0: return False, 'no %s branch on the server yet; staying on %s' % (branch, cur)
    if git(['rev-parse', '--verify', '--quiet', branch], cwd)[0] == 0: rc, _, err = git(['checkout', '--quiet', branch], cwd)
    else: rc, _, err = git(['checkout', '--quiet', '-b', branch, '--track', 'origin/' + branch], cwd)
    return (True, 'switched from %s to %s' % (cur, branch)) if rc == 0 else (False, 'could not switch to %s: %s' % (branch, err.splitlines()[-1] if err else 'git checkout failed'))

def pull(cwd=None, follow_release=True):
    """-> (ok, message). Moves onto the release branch (when asked), then fast-forwards; only with no local changes."""
    notes = []
    if follow_release:
        ok, msg = switch_to_release(cwd)
        if not ok: return False, msg
        if msg.startswith('switched'): notes.append(msg)
    st = code_status(fetch=True, cwd=cwd)
    if not st.get('git') or not st.get('upstream'): return False, st.get('note', 'updates are off')
    if st['changed']: return False, 'not updating: you have local changes (' + ', '.join(st['changed'][:3]) + (' ...' if len(st['changed']) > 3 else '') + ')'
    if notes and not st['behind']: return True, notes[0] + ' (up to date)'
    if not st['behind']: return True, 'code is up to date'
    rc, out, err = git(['pull', '--ff-only', '--quiet'], cwd)
    return (True, ('; '.join(notes) + '; ' if notes else '') + 'pulled %d update%s' % (st['behind'], '' if st['behind'] == 1 else 's')) if rc == 0 else (False, 'could not update: ' + (err.splitlines()[-1] if err else 'git pull failed'))


# ---------------------------------------------------------------- game (install/build) through home-launch.mjs
def launch_status(node):
    r = subprocess.run([node['exe'], str(LAUNCH), '--status'], capture_output=True, text=True, timeout=60, cwd=str(ROOM), creationflags=NO_WINDOW, env={**os.environ, 'BT_FAKE_NODE': node['version'].lstrip('v')})
    try: return json.loads(r.stdout.strip().splitlines()[-1])
    except (ValueError, IndexError):
        raise RuntimeError('Node at %s did not answer the status question (exit %s): %s' % (node['exe'], r.returncode, (r.stderr or r.stdout).strip()[-300:] or 'no output'))

def run_lines(cmd, cwd, env=None, on_line=print):
    """run a command, hand each output line to on_line, -> exit code"""
    p = subprocess.Popen(cmd, cwd=str(cwd), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, text=True, encoding='utf-8', errors='replace', env={**os.environ, **(env or {})}, creationflags=NO_WINDOW)
    for line in p.stdout: on_line(line.rstrip('\n'))
    return p.wait()

def prepare_game(node, on_line=print, rebuild=False):
    args = [node['exe'], str(LAUNCH), '--no-update', '--no-start'] + (['--rebuild'] if rebuild else [])
    return run_lines(args, ROOM, {**GIT_ENV, 'BT_FAKE_NODE': node['version'].lstrip('v')}, on_line) == 0


# ---------------------------------------------------------------- the server
OWNER_RE = re.compile(r'owner page: (http://\S+/owner\?k=[0-9a-f]+)')

class Server:
    """The host as a child process: start, read its output, stop cleanly."""
    def __init__(self, on_line=print):
        self.proc, self.owner_url, self.on_line, self._t = None, None, on_line, None

    @property
    def running(self): return bool(self.proc and self.proc.poll() is None)

    def start(self, node, extra=()):
        if self.running: return True
        st = launch_status(node)
        cmd = [node['exe'], *st['hostArgs'], *extra]
        self.owner_url = None
        self.proc = subprocess.Popen(cmd, cwd=st['hostCwd'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace', env={**os.environ, 'BT_STDIN_STOP': '1'}, creationflags=NO_WINDOW)
        def pump():
            for line in self.proc.stdout:
                line = line.rstrip('\n'); m = OWNER_RE.search(line)
                if m: self.owner_url = m.group(1).replace('http://localhost', 'http://localhost')
                self.on_line(line)
        self._t = threading.Thread(target=pump, daemon=True); self._t.start()
        for _ in range(150):                                   # up to 15 s for the "owner page" line
            if self.owner_url or not self.running: break
            time.sleep(0.1)
        return self.running

    def stop(self, wait=8.0):
        """clean stop (the final save runs); -> exit code, or None if it was not running"""
        if not self.proc: return None
        if self.running:
            try: self.proc.stdin.write('stop\n'); self.proc.stdin.flush()
            except Exception: pass
            try: self.proc.wait(timeout=wait)
            except subprocess.TimeoutExpired:
                self.on_line('[launcher] the server did not stop in time; ending it'); self.proc.kill(); self.proc.wait(5)
        code = self.proc.returncode
        for f in (self.proc.stdin, self.proc.stdout):
            try: f and f.close()
            except Exception: pass
        self.proc = None; self.owner_url = None
        return code


# ---------------------------------------------------------------- logs and diagnostics
SECRET_RE = [(re.compile(r'([?&]k=)[0-9a-f]{8,}'), r'\1[hidden]'),                       # owner-page key
             (re.compile(r'\b[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4} ?[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}\b'), '[code hidden]'),   # session codes
             (re.compile(r'("?(?:token|ticket|secret|pin|password)"?\s*[:=]\s*"?)[^"\s,}]+', re.I), r'\1[hidden]')]

def redact(text):
    for rx, rep in SECRET_RE: text = rx.sub(rep, text)
    return text

class Log:
    """One file a day in <app dir>/logs, the last 10 kept. Every line is timestamped and goes through redact():
    owner keys, session codes, tokens and PINs never reach the disk."""
    KEEP = 10
    def __init__(self, debug=False):
        self.dir = app_dir() / 'logs'; self.dir.mkdir(exist_ok=True); self.debug = debug; self.lock = threading.Lock()
        self.file = self.dir / ('launcher-%s.log' % datetime.date.today().isoformat())
        for old in sorted(self.dir.glob('launcher-*.log'))[:-self.KEEP]:
            try: old.unlink()
            except OSError: pass
    def write(self, line, level='info'):
        if level == 'debug' and not self.debug: return
        with self.lock, open(self.file, 'a', encoding='utf-8') as f:
            f.write('%s %-5s %s\n' % (datetime.datetime.now().strftime('%H:%M:%S'), level, redact(str(line))))
    def tail(self, n=200):
        try: return self.file.read_text('utf-8', 'replace').splitlines()[-n:]
        except OSError: return []

def diagnostics(log=None, node=None, settings=None):
    """A plain-text report to paste into a chat or an issue. Redacted."""
    lines = ['Bertopia Home launcher diagnostics', 'time: ' + datetime.datetime.now().isoformat(timespec='seconds'),
             'launcher: %s (%s)' % (LAUNCHER_VERSION, 'exe' if getattr(sys, 'frozen', False) else 'python ' + platform.python_version()),
             'system: %s %s (%s)' % (platform.system(), platform.release(), platform.machine()), 'repo: ' + str(REPO), 'settings: ' + json.dumps(settings or {})]
    lines.append('node candidates:')
    for exe, label in node_candidates(): lines.append('  %s  %s  %s (%s)' % (label, exe, node_version(exe), node_fit(node_version(exe))))
    lines.append('node in use: ' + (('%s %s (%s)' % (node['exe'], node['version'], node['label'])) if node else 'none'))
    rc, out, err = git(['--version']); lines.append('git: ' + (out or err))
    try:
        st = code_status(fetch=False); lines.append('code: ' + json.dumps({k: st.get(k) for k in ('branch', 'upstream', 'behind', 'ahead', 'changed', 'note')}))
        lines.append('commit: ' + git(['log', '-1', '--format=%h %s'])[1])
    except Exception as e: lines.append('code: ' + repr(e))
    if node:
        try: lines.append('game: ' + json.dumps(launch_status(node)['build']))
        except Exception as e: lines.append('game: ' + repr(e))
    lines.append('data folder: %s (exists: %s)' % (data_dir(), data_dir().exists()))
    if log: lines += ['', 'last log lines:'] + log.tail(200)
    return redact('\n'.join(lines))

def crash_text(exc_type, exc, tb):
    return redact(''.join(traceback.format_exception(exc_type, exc, tb)))


def data_dir():
    return Path(os.path.expanduser('~')) / 'Documents' / 'Bertopia Home'

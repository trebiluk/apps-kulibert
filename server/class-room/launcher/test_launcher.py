"""Checks for the Python launcher (core, self-update, the real host, the window). Standard library unittest.
    python3 -m unittest -v test_launcher            (from server/class-room/launcher)
The window test needs tkinter and a display (xvfb-run on Linux); it skips otherwise."""
import hashlib, http.server, io, json, os, shutil, subprocess, sys, tarfile, tempfile, threading, time, unittest, zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
TMP = Path(tempfile.mkdtemp(prefix='bt-launcher-test-'))
os.environ['BT_APP_DIR'] = str(TMP / 'app')
import bertopia_core as core          # noqa: E402  (after BT_APP_DIR)
import bertopia_launcher as entry     # noqa: E402

REPO = HERE.parent.parent.parent


class Versions(unittest.TestCase):
    def test_node_fit(self):
        self.assertEqual(core.node_fit('v22.13.0'), 'ok'); self.assertEqual(core.node_fit('v26.13.0'), 'ok')
        self.assertEqual(core.node_fit('v22.12.0'), 'flag'); self.assertEqual(core.node_fit('v22.5.0'), 'flag')
        self.assertEqual(core.node_fit('v22.4.9'), 'old'); self.assertEqual(core.node_fit('v20.11.1'), 'old'); self.assertIsNone(core.node_fit('garbage'))

    def test_latest_lts_picks_newest_22_for_this_platform(self):
        idx = [{'version': 'v24.1.0', 'lts': 'Krypton', 'files': ['win-x64-zip', 'linux-x64']},
               {'version': 'v22.23.4', 'lts': 'Jod', 'files': ['win-x64-zip', 'linux-x64']},
               {'version': 'v22.30.0', 'lts': False, 'files': ['win-x64-zip', 'linux-x64']},
               {'version': 'v22.9.0', 'lts': 'Jod', 'files': ['win-x64-zip', 'linux-x64']},
               {'version': 'v22.24.0', 'lts': 'Jod', 'files': ['linux-x64']}]
        self.assertEqual(core.latest_lts(idx, key='win-x64-zip'), 'v22.23.4')
        self.assertEqual(core.latest_lts(idx, key='linux-x64'), 'v22.24.0')

    def test_launcher_versions(self):
        f = TMP / 'v.py'; f.write_text("x = 1\nLAUNCHER_VERSION = '1.10.2'\n")
        self.assertEqual(core.launcher_version_in(f), '1.10.2')
        self.assertGreater(core.version_tuple('1.10.2'), core.version_tuple('1.9.9'))
        self.assertIsNone(core.launcher_version_in(TMP / 'missing.py'))


class Logs(unittest.TestCase):
    def test_redact(self):
        t = core.redact('owner page: http://localhost:8890/owner?k=c3e94dafefb00251d87659083505c400 code SR36 GN58 / SR36GN58 {"token":"abc"} pin=246810 game 2.5.596 world gibberland')
        for secret in ('c3e94daf', 'SR36', 'GN58', 'abc', '246810'): self.assertNotIn(secret, t)
        for kept in ('2.5.596', 'gibberland', 'localhost:8890'): self.assertIn(kept, t)

    def test_log_file_redacts_rotates_and_filters_debug(self):
        d = core.app_dir() / 'logs'; d.mkdir(parents=True, exist_ok=True)
        for i in range(14): (d / ('launcher-2026-01-%02d.log' % (i + 1))).write_text('old')
        log = core.Log(debug=False)
        self.assertLessEqual(len(list(d.glob('launcher-*.log'))), core.Log.KEEP)
        log.write('owner page: http://x/owner?k=deadbeefdeadbeef'); log.write('hidden detail', 'debug')
        text = log.file.read_text()
        self.assertIn('k=[hidden]', text); self.assertNotIn('deadbeef', text); self.assertNotIn('hidden detail', text)
        log.debug = True; log.write('now shown', 'debug'); self.assertIn('now shown', log.file.read_text())

    def test_settings_survive_junk(self):
        (core.app_dir() / 'launcher.json').write_text('{"auto_update": "yes", "own_node": true, "evil": 1}')
        s = core.load_settings()
        self.assertEqual(s, {'auto_update': True, 'own_node': True, 'start_on_open': False, 'debug': False})
        core.save_settings({**s, 'debug': True}); self.assertTrue(core.load_settings()['debug'])

    def test_diagnostics_are_redacted(self):
        core.set_repo(REPO)
        log = core.Log(); log.write('owner page: http://localhost:8890/owner?k=0123456789abcdef0123')
        text = core.diagnostics(log, None, {'debug': True})
        self.assertIn('launcher: ' + core.LAUNCHER_VERSION, text); self.assertIn('node candidates:', text); self.assertIn('git:', text)
        self.assertNotIn('0123456789abcdef0123', text)


@unittest.skipIf(core.WIN, 'fake node scripts are POSIX shell')
class NodeChoice(unittest.TestCase):
    def fake(self, folder, version):
        folder.mkdir(parents=True, exist_ok=True); p = folder / 'node'
        p.write_text('#!/bin/sh\necho %s\n' % version); p.chmod(0o755); return p

    def test_prefers_a_good_pc_node_then_flag_then_own(self):
        bin1 = TMP / 'pcbin'; self.fake(bin1, 'v22.12.0')
        own = core.app_dir() / 'node-v22.23.4-linux-x64' / 'bin'; self.fake(own, 'v22.23.4')
        old = os.environ['PATH']; os.environ['PATH'] = str(bin1) + os.pathsep + '/usr/bin:/bin'
        try:
            n = core.pick_node()
            self.assertEqual((n['version'], n['label']), ('v22.23.4', "Bertopia's own"))     # ok beats flag
            self.fake(bin1, 'v26.13.0'); n = core.pick_node()
            self.assertEqual((n['version'], n['label']), ('v26.13.0', 'this PC'))
            self.assertEqual(core.pick_node(prefer_own=True)['label'], "Bertopia's own")
            self.fake(bin1, 'v22.12.0'); shutil.rmtree(own.parent); n = core.pick_node()
            self.assertEqual((n['version'], n['fit']), ('v22.12.0', 'flag'))
            self.fake(bin1, 'v20.1.0'); self.assertIsNone(core.pick_node())
        finally:
            os.environ['PATH'] = old


@unittest.skipIf(core.WIN, 'serves a linux-x64 tarball')
class OwnNode(unittest.TestCase):
    """Bertopia's own Node from a stand-in nodejs.org: checked, unpacked, refreshed, a bad download refused."""
    @classmethod
    def setUpClass(cls):
        cls.root = TMP / 'dist'; cls.root.mkdir()
        h = lambda *a, **k: http.server.SimpleHTTPRequestHandler(*a, directory=str(cls.root), **k)
        http.server.SimpleHTTPRequestHandler.log_message = lambda *a: None
        cls.srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        core.DIST = 'http://127.0.0.1:%d' % cls.srv.server_address[1]

    @classmethod
    def tearDownClass(cls): cls.srv.shutdown()

    def publish(self, v, corrupt=False):
        name = 'node-%s-linux-x64' % v
        buf = io.BytesIO()
        with tarfile.open(fileobj=buf, mode='w:xz') as t:
            data = ('#!/bin/sh\necho %s\n' % v).encode(); info = tarfile.TarInfo(name + '/bin/node'); info.size = len(data); info.mode = 0o755
            t.addfile(info, io.BytesIO(data))
        blob = buf.getvalue(); d = self.root / v; d.mkdir(exist_ok=True)
        (d / (name + '.tar.xz')).write_bytes(blob + (b'x' if corrupt else b''))
        (d / 'SHASUMS256.txt').write_text('%s  %s.tar.xz\n' % (hashlib.sha256(blob).hexdigest(), name))
        idx = json.loads((self.root / 'index.json').read_text()) if (self.root / 'index.json').exists() else []
        idx.insert(0, {'version': v, 'lts': 'Jod', 'files': ['linux-x64', 'win-x64-zip']}); (self.root / 'index.json').write_text(json.dumps(idx))

    def test_fetch_refresh_and_refuse(self):
        for d in core.own_node_dirs(): shutil.rmtree(d)
        self.publish('v22.40.0'); lines = []
        exe = core.ensure_own_node(log=lines.append)
        self.assertEqual(subprocess.run([exe, '-v'], capture_output=True, text=True).stdout.strip(), 'v22.40.0')
        self.assertTrue(any('Checksum OK' in l for l in lines))
        core.ensure_own_node(log=lines.append); self.assertIn('up to date', lines[-1])
        self.publish('v22.41.0'); exe2 = core.ensure_own_node(log=lines.append)
        self.assertIn('v22.41.0', exe2); self.assertEqual([d.name for d in core.own_node_dirs()], ['node-v22.41.0-linux-x64'])   # old copy removed
        self.publish('v22.42.0', corrupt=True)
        with self.assertRaisesRegex(RuntimeError, 'checksum mismatch'): core.ensure_own_node(log=lines.append)
        self.assertEqual([d.name for d in core.own_node_dirs()], ['node-v22.41.0-linux-x64'])                                  # the good one stays
        self.assertFalse(list(core.app_dir().glob('.unpack-*')))


class Code(unittest.TestCase):
    """git: behind count, fast-forward pull, local changes block, no upstream"""
    def g(self, cwd, *a):
        env = {**os.environ, 'GIT_AUTHOR_NAME': 't', 'GIT_AUTHOR_EMAIL': 't@t', 'GIT_COMMITTER_NAME': 't', 'GIT_COMMITTER_EMAIL': 't@t'}
        return subprocess.run(['git', *a], cwd=cwd, capture_output=True, text=True, env=env)

    def test_update_flow(self):
        up, a, b = TMP / 'up.git', TMP / 'a', TMP / 'b'
        self.g(TMP, 'init', '-q', '--bare', '-b', 'main', str(up)); self.g(TMP, 'clone', '-q', str(up), str(a))
        (a / 'f.txt').write_text('1'); self.g(a, 'add', '-A'); self.g(a, 'commit', '-qm', 'one'); self.g(a, 'push', '-q', 'origin', 'HEAD:main')
        self.g(TMP, 'clone', '-q', str(up), str(b))
        self.assertEqual(core.code_status(cwd=b)['behind'], 0); self.assertEqual(core.pull(cwd=b), (True, 'code is up to date'))
        for i in (2, 3): (a / 'f.txt').write_text(str(i)); self.g(a, 'commit', '-qam', str(i))
        self.g(a, 'push', '-q', 'origin', 'HEAD:main')
        st = core.code_status(cwd=b); self.assertEqual((st['behind'], st['fetched']), (2, True))
        (b / 'f.txt').write_text('mine')
        ok, msg = core.pull(cwd=b); self.assertFalse(ok); self.assertIn('local changes (f.txt)', msg)
        self.g(b, 'checkout', '--', 'f.txt'); (b / 'new-untracked.txt').write_text('x')
        self.assertEqual(core.pull(cwd=b), (True, 'pulled 2 updates')); self.assertEqual((b / 'f.txt').read_text(), '3')
        self.g(b, 'checkout', '-q', '-b', 'local-only')
        self.assertIn('tracks no remote', core.code_status(cwd=b)['note'])
        self.assertFalse(core.code_status(cwd=TMP)['git'])


class SelfUpdate(unittest.TestCase):
    def make(self, where, version, broken=False):
        d = Path(where) / 'server' / 'class-room' / 'launcher'; d.mkdir(parents=True, exist_ok=True)
        src = (HERE / 'bertopia_core.py').read_text().replace("LAUNCHER_VERSION = '%s'" % core.LAUNCHER_VERSION, "LAUNCHER_VERSION = '%s'" % version)
        (d / 'bertopia_core.py').write_text(src + ('\nthis is not python (\n' if broken else ''))
        (d / 'bertopia_gui.py').write_text('import bertopia_core\nMARK = "%s"\ndef main(): pass\n' % version)
        return d

    def test_exe_runs_a_newer_repo_launcher_and_falls_back_from_a_broken_one(self):
        repo = TMP / 'repo-new'; self.make(repo, '9.9.9')
        use, note = entry.choose(HERE, repo, True, core)
        self.assertEqual(use, repo / 'server' / 'class-room' / 'launcher'); self.assertIn('9.9.9', note)
        self.assertIsNone(entry.load(use, HERE, core)); self.assertEqual(sys.modules['bertopia_gui'].MARK, '9.9.9')
        self.assertEqual(sys.modules['bertopia_core'].LAUNCHER_VERSION, '9.9.9')
        self.assertEqual(entry.choose(HERE, repo, False, core)[0], HERE)                          # the .pyw always runs the repo's own files
        old = TMP / 'repo-old'; self.make(old, '0.0.1'); self.assertEqual(entry.choose(HERE, old, True, core)[0], HERE)
        bad = TMP / 'repo-bad'; self.make(bad, '9.9.10', broken=True)
        use, _ = entry.choose(HERE, bad, True, core); note = entry.load(use, HERE, core)
        self.assertIn('did not load', note); self.assertIs(sys.modules['bertopia_core'], core)
        sys.modules['bertopia_core'] = core; sys.modules.pop('bertopia_gui', None)


@unittest.skipUnless(shutil.which('node'), 'needs node')
class RealServer(unittest.TestCase):
    """the real host, started and stopped the way the launcher does it (stdin "stop": the final save runs)"""
    def test_start_and_clean_stop(self):
        core.set_repo(REPO); n = core.pick_node(); self.assertIsNotNone(n)
        lines = []; s = core.Server(on_line=lines.append); port = str(19790 + os.getpid() % 100)
        self.assertTrue(s.start(n, extra=['--port', port, '--data', str(TMP / 'data')]))
        self.assertTrue(s.owner_url and ('localhost:' + port) in s.owner_url and '?k=' in s.owner_url)
        self.assertTrue((TMP / 'data' / 'home.json').exists())
        code = s.stop(); time.sleep(0.2)
        self.assertEqual(code, 0); self.assertTrue(any('[home] stopping' in l for l in lines)); self.assertFalse(s.running)


class Window(unittest.TestCase):
    def test_window_opens_and_closes_cleanly(self):
        try: import tkinter; tkinter.Tk().destroy()
        except Exception as e: self.skipTest('no tkinter/display: %s' % e)
        core.save_settings(dict(core.DEFAULTS))          # earlier tests changed settings and planted a stand-in Node
        shot = os.environ.get('BT_LAUNCHER_SHOT_TEST')
        env = {**os.environ, 'BT_LAUNCHER_SELFTEST': '15000', **({'BT_LAUNCHER_SHOT': shot} if shot else {})}
        r = subprocess.run([sys.executable, str(REPO / 'Bertopia Launcher.pyw')], env=env, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stderr[-2000:])
        log = core.Log().tail(80)
        self.assertTrue(any('selftest done' in l for l in log)); self.assertFalse(any(' error ' in l for l in log), '\n'.join(log))
        self.assertTrue(any('checked.' in l for l in log), '\n'.join(log))


def tearDownModule(): shutil.rmtree(TMP, ignore_errors=True)

if __name__ == '__main__':
    unittest.main()

"""Entry point for "Bertopia Launcher.pyw" and for the .exe (build-exe.cmd).

Self-update: the launcher lives in the repo, so `git pull` brings new launcher code. A frozen .exe compares its own
built-in launcher with the repo's (LAUNCHER_VERSION) and runs the repo's copy when it is newer, so launcher updates
arrive without rebuilding the .exe. If the newer copy fails to load, it falls back to the built-in one and says so.
"""
import importlib.util, os, sys
from pathlib import Path

FROZEN = getattr(sys, 'frozen', False)
HERE = Path(getattr(sys, '_MEIPASS', Path(__file__).resolve().parent))      # built-in copy (inside the .exe) or this folder


def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    mod = importlib.util.module_from_spec(spec); sys.modules[name] = mod; spec.loader.exec_module(mod)
    return mod


def pick_repo():
    import bertopia_core as builtin
    start = Path(sys.executable).parent if FROZEN else Path(__file__).resolve().parent
    repo = os.environ.get('BT_REPO') or builtin.find_repo(start) or builtin.find_repo(Path.cwd())
    if not repo:
        saved = builtin.app_dir() / 'repo.txt'
        if saved.exists() and builtin.find_repo(saved.read_text('utf-8').strip()): repo = saved.read_text('utf-8').strip()
    if not repo:
        import tkinter as tk; from tkinter import filedialog, messagebox
        root = tk.Tk(); root.withdraw()
        messagebox.showinfo('Bertopia Home', 'Pick your apps-kulibert folder (the git checkout with server\\class-room in it).')
        pick = filedialog.askdirectory(title='Your apps-kulibert folder'); root.destroy()
        if not pick or not builtin.find_repo(pick): sys.exit('no apps-kulibert checkout chosen')
        repo = str(builtin.find_repo(pick)); saved.write_text(repo, 'utf-8')
    repo = Path(repo).resolve()
    try: (builtin.app_dir() / 'repo.txt').write_text(str(repo), 'utf-8')   # so the .exe finds it from anywhere (a desktop copy)
    except OSError: pass
    return repo


def choose(here, repo, frozen, builtin):
    """-> (folder to load the launcher from, note or None). Only a frozen .exe ever switches to the repo's copy."""
    repo_dir = Path(repo) / 'server' / 'class-room' / 'launcher'
    newer = builtin.launcher_version_in(repo_dir / 'bertopia_core.py')
    if frozen and newer and builtin.version_tuple(newer) > builtin.version_tuple(builtin.LAUNCHER_VERSION):
        return repo_dir, 'running the newer launcher %s from the repo (this .exe has %s)' % (newer, builtin.LAUNCHER_VERSION)
    return Path(here), None


def load(use, here, builtin):
    """load bertopia_core + bertopia_gui from `use`; on any failure fall back to the built-in modules. -> note or None"""
    if Path(use) == Path(here): return None
    try:
        for m in ('bertopia_core', 'bertopia_gui'): sys.modules.pop(m, None)
        _load('bertopia_core', Path(use) / 'bertopia_core.py'); _load('bertopia_gui', Path(use) / 'bertopia_gui.py')
        return None
    except Exception as e:      # a broken newer copy never locks you out: back to the built-in one
        for m in ('bertopia_core', 'bertopia_gui'): sys.modules.pop(m, None)
        sys.modules['bertopia_core'] = builtin
        return 'the newer launcher in the repo did not load (%s: %s); using the built-in %s' % (type(e).__name__, e, builtin.LAUNCHER_VERSION)


def main():
    sys.path.insert(0, str(HERE))
    repo = pick_repo()
    import bertopia_core as builtin
    use, note = choose(HERE, repo, FROZEN, builtin)
    note = load(use, HERE, builtin) or note
    import bertopia_core as core, bertopia_gui as gui
    core.set_repo(repo)
    if note: core.Log().write(note, 'warn')
    gui.main()


if __name__ == '__main__':
    main()

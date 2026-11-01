"""Bertopia Home launcher window (tkinter, standard library). The work is in bertopia_core; this file is the window.
Long jobs run on a worker thread; the window only reads a queue, so it never freezes."""
import os, queue, subprocess, sys, threading, time, webbrowser
import tkinter as tk
from tkinter import ttk, messagebox
from tkinter.scrolledtext import ScrolledText
import bertopia_core as core

BG, CARD, FG, DIM, TEAL, WARN = '#0f172a', '#111827', '#f8fafc', '#94a3b8', '#2dd4bf', '#fbbf24'


class App:
    def __init__(self, root, autostart=False):
        self.root, self.q = root, queue.Queue()
        self.settings = core.load_settings()
        self.log = core.Log(debug=self.settings['debug'])
        self.node = None; self.busy = False; self.closed = False
        self.server = core.Server(on_line=lambda l: self.say(l, 'server'))
        root.title('Bertopia Home launcher')
        root.configure(bg=BG); root.minsize(760, 600); root.geometry('900x760')
        self._style(); self._build()
        root.protocol('WM_DELETE_WINDOW', self.on_close)
        root.report_callback_exception = self.on_crash
        self.say('Bertopia Home launcher %s (adults 18+). Repo: %s' % (core.LAUNCHER_VERSION, core.REPO))
        root.after(100, self.pump)
        self.work('check', self.do_check)
        if autostart or self.settings['start_on_open']: root.after(300, self.on_start)

    # ---------------------------------------------------------------- look
    def _style(self):
        s = ttk.Style(self.root)
        try: s.theme_use('clam')
        except tk.TclError: pass
        base = ('Segoe UI', 11) if core.WIN else ('DejaVu Sans', 11)
        s.configure('.', background=BG, foreground=FG, font=base)
        s.configure('Card.TFrame', background=CARD)
        s.configure('TLabel', background=CARD, foreground=FG)
        s.configure('Head.TLabel', background=BG, foreground=FG, font=(base[0], 17, 'bold'))
        s.configure('Dim.TLabel', background=BG, foreground=DIM)
        s.configure('Key.TLabel', background=CARD, foreground=DIM)
        s.configure('TButton', padding=(14, 10), background='#1f2937', foreground=FG, bordercolor='#475569', focuscolor=TEAL)
        s.map('TButton', background=[('disabled', '#111827'), ('active', '#334155')], foreground=[('disabled', '#64748b')])
        s.configure('Go.TButton', background='#0f766e')
        s.map('Go.TButton', background=[('disabled', '#134e4a'), ('active', '#14b8a6')])
        s.configure('Stop.TButton', background='#7f1d1d')
        s.map('Stop.TButton', background=[('disabled', '#3f1d1d'), ('active', '#b91c1c')])
        s.configure('TCheckbutton', background=BG, foreground=FG, padding=6)
        s.map('TCheckbutton', background=[('active', BG)])

    def _build(self):
        r = self.root
        top = ttk.Frame(r, style='TFrame', padding=(16, 12, 16, 4)); top.pack(fill='x')
        ttk.Label(top, text='Bertopia Home', style='Head.TLabel').pack(side='left')
        ttk.Label(top, text='  adults 18+ · launcher ' + core.LAUNCHER_VERSION, style='Dim.TLabel').pack(side='left', pady=(6, 0))

        card = ttk.Frame(r, style='Card.TFrame', padding=14); card.pack(fill='x', padx=16, pady=6)
        self.st = {}
        for i, (k, label) in enumerate((('node', 'Node'), ('code', 'Code'), ('game', 'Game'), ('server', 'Server'))):
            ttk.Label(card, text=label, style='Key.TLabel', width=8).grid(row=i, column=0, sticky='w', pady=3)
            v = ttk.Label(card, text='checking ...', wraplength=700, justify='left'); v.grid(row=i, column=1, sticky='w', pady=3); self.st[k] = v
        card.columnconfigure(1, weight=1)

        row1 = ttk.Frame(r, padding=(16, 6)); row1.pack(fill='x')
        self.b_start = ttk.Button(row1, text='▶  Update & start', style='Go.TButton', command=self.on_start)
        self.b_stop = ttk.Button(row1, text='■  Stop server', style='Stop.TButton', command=self.on_stop)
        self.b_owner = ttk.Button(row1, text='Open owner page', command=self.on_owner)
        for b in (self.b_start, self.b_stop, self.b_owner): b.pack(side='left', padx=(0, 8))
        row2 = ttk.Frame(r, padding=(16, 2)); row2.pack(fill='x')
        self.b_check = ttk.Button(row2, text='Check for updates', command=lambda: self.work('check', self.do_check))
        self.b_build = ttk.Button(row2, text='Rebuild game', command=lambda: self.work('rebuild', self.do_rebuild))
        self.b_data = ttk.Button(row2, text='Open data folder', command=lambda: self.open_path(core.data_dir()))
        self.b_logs = ttk.Button(row2, text='Open logs', command=lambda: self.open_path(self.log.dir))
        self.b_diag = ttk.Button(row2, text='Copy diagnostics', command=lambda: self.work('diagnostics', self.do_diag))
        for b in (self.b_check, self.b_build, self.b_data, self.b_logs, self.b_diag): b.pack(side='left', padx=(0, 8))

        opts = ttk.Frame(r, padding=(12, 4)); opts.pack(fill='x')
        self.vars = {}
        for k, text in (('auto_update', 'Update automatically before starting (code, Node, game)'), ('own_node', "Use Bertopia's own Node (official LTS, kept up to date)"),
                        ('follow_release', 'Follow the newest Bertopia Home release (the "%s" branch)' % core.RELEASE_BRANCH), ('start_on_open', 'Start the server when the launcher opens'), ('debug', 'Debug log (more detail in the log file)')):
            v = tk.BooleanVar(value=self.settings[k]); self.vars[k] = v
            ttk.Checkbutton(opts, text=text, variable=v, command=self.on_setting).pack(anchor='w')

        self.out = ScrolledText(r, height=12, bg='#020617', fg='#e2e8f0', insertbackground=FG, relief='flat', font=('Consolas', 10) if core.WIN else ('DejaVu Sans Mono', 9), wrap='word')
        self.out.pack(fill='both', expand=True, padx=16, pady=(6, 14)); self.out.configure(state='disabled')
        self.out.tag_configure('server', foreground='#a7f3d0'); self.out.tag_configure('warn', foreground=WARN); self.out.tag_configure('build', foreground='#cbd5e1')
        self.paint()

    # ---------------------------------------------------------------- plumbing
    def say(self, text, kind='info'):
        """thread-safe: to the window (via the queue) and to the log file"""
        self.log.write(text, 'warn' if kind == 'warn' else 'info'); self.q.put(('line', text, kind))

    def set_status(self, key, text, warn=False): self.q.put(('status', key, text, warn))

    def pump(self):
        if self.closed: return
        try:
            while True:
                m = self.q.get_nowait()
                if m[0] == 'line':
                    self.out.configure(state='normal'); self.out.insert('end', core.redact(m[1]) + '\n', m[2]); n = int(self.out.index('end-1c').split('.')[0])
                    if n > 1500: self.out.delete('1.0', '%d.0' % (n - 1200))
                    self.out.see('end'); self.out.configure(state='disabled')
                elif m[0] == 'status': self.st[m[1]].configure(text=m[2], foreground=WARN if m[3] else FG)
                elif m[0] == 'done': self.busy = False; self.paint()
                elif m[0] == 'call': m[1]()
        except queue.Empty:
            pass
        if self.server.proc and not self.server.running and not self.busy:
            code = self.server.stop(); self.say('server stopped (exit %s)' % code, 'warn' if code else 'info'); self.paint()
        self.root.after(100, self.pump)

    def work(self, name, fn):
        if self.busy: return
        self.busy = True; self.paint()
        def run():
            try: fn()
            except Exception as e:
                self.log.write(core.crash_text(type(e), e, e.__traceback__), 'error')
                self.say('%s failed: %s (details in the log; "Copy diagnostics" collects them)' % (name, e), 'warn')
            finally: self.q.put(('done',))
        threading.Thread(target=run, daemon=True).start()

    def paint(self):
        up = self.server.running
        self.set_status('server', ('running · ' + (self.server.owner_url or 'starting ...').split('?')[0].replace('/owner', '/')) if up else 'stopped', False)
        st = lambda b, on: b.configure(state='normal' if on else 'disabled')
        st(self.b_start, not self.busy and not up); st(self.b_stop, up); st(self.b_owner, up and bool(self.server.owner_url))
        st(self.b_check, not self.busy); st(self.b_build, not self.busy and not up); st(self.b_diag, not self.busy)

    # ---------------------------------------------------------------- jobs (worker thread)
    def find_node(self, fetch_if_needed):
        n = core.pick_node(prefer_own=self.settings['own_node'])
        if fetch_if_needed and (self.settings['own_node'] or not n):
            if not n: self.say('No usable Node found (needs 22.13+). Getting the official Node 22 LTS ...', 'warn')
            core.ensure_own_node(log=self.say)                          # also refreshes it to the newest 22 LTS
            n = core.pick_node(prefer_own=True)
        self.node = n
        if n: self.set_status('node', '%s · %s%s' % (n['version'], n['label'], ' · with --experimental-sqlite' if n['fit'] == 'flag' else ''))
        else: self.set_status('node', 'none usable (needs 22.13+): "Update & start" fetches the official LTS', True)
        return n

    def show_code(self, st):
        if not st.get('git'): self.set_status('code', st.get('note', 'not a git checkout'), True); return
        bits = [st.get('branch') or '?']
        if st.get('changed'): bits.append('local changes: ' + ', '.join(st['changed'][:2]) + (' ...' if len(st['changed']) > 2 else ''))
        elif st.get('behind'): bits.append('%d update%s ready' % (st['behind'], '' if st['behind'] == 1 else 's'))
        elif st.get('upstream'): bits.append('up to date' if st.get('fetched') else 'could not check')
        if st.get('note'): bits.append(st['note'])
        self.set_status('code', ' · '.join(bits), bool(st.get('changed') or st.get('behind') or st.get('note')))

    def show_game(self):
        if not self.node: self.set_status('game', 'waiting for Node', True); return
        g = core.launch_status(self.node)
        self.log.write('status: ' + str(g), 'debug')
        b = g['build']
        self.set_status('game', ('built · ' if b['built'] else '') + b['why'] + (' · ' + g['install']['why'] if b['need'] and g['install']['need'] else ''), b['need'])

    def do_check(self):
        self.find_node(fetch_if_needed=False)
        st = core.code_status(fetch=True); self.show_code(st)
        self.show_game()
        newer = core.repo_launcher_version()
        if newer and core.version_tuple(newer) > core.version_tuple(core.LAUNCHER_VERSION):
            self.say('A newer launcher (%s) is in the repo: it is used the next time the launcher opens.' % newer, 'warn')
        self.say('checked.')

    def do_start(self):
        if self.settings['auto_update']:
            ok, msg = core.pull(follow_release=self.settings['follow_release']); self.say('code: ' + msg, 'info' if ok else 'warn'); pulled = ok
            newer = core.repo_launcher_version()
            if newer and core.version_tuple(newer) > core.version_tuple(core.LAUNCHER_VERSION):
                self.say('The launcher itself was updated (%s). Restarting it ...' % newer, 'warn')
                self.q.put(('call', lambda: restart(autostart=True))); return
        else: pulled = False
        st = core.code_status(fetch=False); st['fetched'] = pulled or st.get('fetched')   # pull() just fetched: no second trip
        self.show_code(st)
        n = self.find_node(fetch_if_needed=True)
        if not n: raise RuntimeError('no usable Node')
        self.say('game: checking the build (installs and builds only when something changed) ...')
        if not core.prepare_game(n, on_line=lambda l: self.say(l, 'build')): raise RuntimeError('install or build failed (see the lines above)')
        self.show_game()
        self.say('starting the server ...')
        if not self.server.start(n): raise RuntimeError('the server stopped right away (see the lines above)')
        self.q.put(('call', self.paint))
        if self.server.owner_url: self.q.put(('call', lambda: webbrowser.open(self.server.owner_url)))

    def do_rebuild(self):
        n = self.find_node(fetch_if_needed=True)
        if not core.prepare_game(n, on_line=lambda l: self.say(l, 'build'), rebuild=True): raise RuntimeError('build failed (see the lines above)')
        self.show_game()

    def do_diag(self):
        text = core.diagnostics(self.log, self.node, self.settings)
        path = self.log.dir / 'diagnostics.txt'; path.write_text(text, 'utf-8')
        self.q.put(('call', lambda: (self.root.clipboard_clear(), self.root.clipboard_append(text))))
        self.say('diagnostics copied to the clipboard and saved to %s (owner keys, codes and tokens are hidden)' % path)

    # ---------------------------------------------------------------- buttons
    def on_start(self): self.work('start', self.do_start)

    def on_stop(self):
        def stop():
            self.say('stopping the server (saving the world) ...'); code = self.server.stop()
            self.say('server stopped (exit %s)' % code); self.q.put(('call', self.paint))
        self.work('stop', stop) if not self.busy else threading.Thread(target=stop, daemon=True).start()

    def on_owner(self):
        if self.server.owner_url: webbrowser.open(self.server.owner_url)

    def on_setting(self):
        for k, v in self.vars.items(): self.settings[k] = bool(v.get())
        core.save_settings(self.settings); self.log.debug = self.settings['debug']
        self.log.write('settings: ' + str(self.settings), 'debug')

    def open_path(self, p):
        p.mkdir(parents=True, exist_ok=True)
        if core.WIN: os.startfile(str(p))   # noqa: only on Windows
        else: subprocess.Popen(['xdg-open', str(p)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def on_close(self):
        if self.server.running:
            if not messagebox.askyesno('Stop the server?', 'The server is running. Stop it (the world is saved) and close the launcher?'): return
            self.say('stopping the server before closing ...'); self.server.stop()
        self.quit()

    def quit(self):
        self.closed = True; self.log.write('launcher closed')
        try: self.root.destroy()
        except tk.TclError: pass

    def on_crash(self, exc_type, exc, tb):
        text = core.crash_text(exc_type, exc, tb); self.log.write(text, 'error')
        if self.closed: return                       # a late callback after closing: logged, no dialog on a dead window
        try: messagebox.showerror('Something went wrong', 'The launcher hit a problem. It was written to the log.\n\n"Copy diagnostics" collects what is needed to fix it.\n\n' + str(exc))
        except tk.TclError: pass


def restart(autostart=False):
    """run the launcher again (it picks up a newer copy from the repo), then quit this one"""
    args = [sys.executable] + ([] if getattr(sys, 'frozen', False) else [os.path.abspath(sys.argv[0])]) + (['--start'] if autostart else [])
    subprocess.Popen(args, cwd=str(core.REPO), creationflags=0x00000008 if core.WIN else 0)   # DETACHED_PROCESS on Windows
    os._exit(0)


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    root = tk.Tk()
    try: root.iconbitmap(str(core.ROOM / 'tools' / 'pack' / 'bertopia.ico')) if core.WIN else None
    except tk.TclError: pass
    app = App(root, autostart='--start' in argv)
    if os.environ.get('BT_LAUNCHER_SELFTEST'):     # checks only: draw, optional screenshot, quit
        ms = int(os.environ['BT_LAUNCHER_SELFTEST'])
        if os.environ.get('BT_LAUNCHER_SHOT'):
            def shot():
                root.update(); x, y, w, h = root.winfo_rootx(), root.winfo_rooty(), root.winfo_width(), root.winfo_height()
                try:
                    from PIL import ImageGrab   # checks only (not part of the launcher)
                    ImageGrab.grab(bbox=(x, y, x + w, y + h)).save(os.environ['BT_LAUNCHER_SHOT'])
                except ImportError:            # no Pillow: ImageMagick's `import` (Linux checks)
                    subprocess.run(['import', '-window', 'root', '-crop', '%dx%d+%d+%d' % (w, h, x, y), os.environ['BT_LAUNCHER_SHOT']], timeout=20)
            root.after(max(100, ms - 400), shot)
        root.after(ms, lambda: (app.log.write('selftest done'), app.server.stop(), app.quit()))
    root.mainloop()

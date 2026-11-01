# Double-click to open the Bertopia Home launcher (Windows runs .pyw files without a console window).
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "server", "class-room", "launcher"))
import bertopia_launcher
bertopia_launcher.main()

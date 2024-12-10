import paramiko
from getpass import getpass
import io
import json


class Remote:

    def __init__(self, host, user, key_path="~/.ssh/id_rsa", pwd=None):
        #paramiko.RSAKey.from_private_key_file(key_path, password=pwd)
        self._c = paramiko.SSHClient()
        self._c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        self._c.connect(hostname=host, username=user, key_filename = key_path)
        self._sftp = self._c.open_sftp()

    def closeConnection(self):
        self._c.close()

    def writeJSON(self, obj, path):
        try:
            f = io.StringIO(json.dumps(obj))
            self._sftp.putfo(f, path)
            return True
        except Exception as e:
            print(e)
            return False

    def writeFile(self, string, path):
        try:
            f = io.StringIO(string)
            self._sftp.putfo(f, path)
            return True
        except Exception as e:
            print(e)
            return False

    def sshCommands(self, command, blocking = True):
        stdin, stdout, ssh_stderr = self._c.exec_command(command)
        #output = stdout.read()
        #print(stdout.read())
        #print(ssh_stderr.read())
        if blocking:
            return stdout.read().decode('ascii').strip("\n")
        else:
            return "command sent"

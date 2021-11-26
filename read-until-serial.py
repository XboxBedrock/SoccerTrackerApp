import sys
import serial
import subprocess


def read(port, num_bytes):
    return subprocess.run(['python3', 'read-from-serial.py', port, str(num_bytes)], capture_output=True).stdout.decode('utf-8')


with serial.Serial(sys.argv[1], 115200) as port:
    data = ''
    while (not data or data[-1] != sys.argv[2]):
        data += read(port.port, 1)

sys.stdout.write(data)
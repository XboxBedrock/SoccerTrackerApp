import sys
import serial
import time

# with serial.Serial(sys.argv[1], 115200) as port:
#     sys.stdout.write(port.read(int(sys.argv[2])).decode('utf-8'))

port = serial.Serial(sys.argv[1], 115200)
sys.stdout.write(port.read(int(sys.argv[2])).decode('utf-8'))
port.close()
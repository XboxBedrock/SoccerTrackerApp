import sys
import serial

with serial.Serial(sys.argv[1], 115200) as port:
    port.write(sys.argv[2].encode('utf-8'))
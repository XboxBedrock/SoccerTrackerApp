const NP_ACCEL = 0.119;
const NPS_ACCEL = 0.0898;
const GAIN_ACCEL = 0.025;

function filterAccel(val, prevVal) {
  if (val < prevVal - NP_ACCEL || val > prevVal - NP_ACCEL) return val;
  if (val < prevVal - NPS_ACCEL || val > prevVal - NPS_ACCEL)
    return (val + prev_val) / 2;
  return (1 - GAIN_ACCEL) * prevVal + GAIN_ACCEL * val;
}

const NP_MAG = 3.5;
const GAIN_MAG = 0.025;

function filterMag(val, prev_val) {
    if (val < prevVal - NP_MAG || val > prevVal + NP_MAG) return val;
    return (1 - GAIN_MAG) * prevVal + GAIN_MAG * val;
}

const NP_GYRO = 0.267;

function filterGyro(val) {
    if (val < -NP_GYRO || val > NP_GYRO) return val;
    return 0;
}

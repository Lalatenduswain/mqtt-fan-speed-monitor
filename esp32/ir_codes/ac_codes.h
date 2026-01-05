/*
 * Common AC IR Codes Library
 *
 * This file contains IR codes for popular AC brands.
 * Note: Codes may vary by model. Use IR learning mode to capture
 * your specific remote's codes.
 *
 * Usage:
 * 1. Include this header in your project
 * 2. Use the codes with IRremoteESP8266 library
 * 3. Or send via MQTT: {"code": "0x...", "protocol": "...", "bits": 32}
 */

#ifndef AC_CODES_H
#define AC_CODES_H

// ============================================================
// PROTOCOL TYPES
// ============================================================

// Most ACs use these protocols:
// - NEC: Many Chinese brands, some Japanese
// - SAMSUNG: Samsung ACs
// - LG: LG ACs (also LG2 for newer models)
// - DAIKIN: Daikin ACs (complex protocol)
// - COOLIX: Midea, Carrier, and many Indian brands
// - GREE: Gree, Godrej, and some Voltas
// - MITSUBISHI: Mitsubishi ACs
// - TOSHIBA: Toshiba ACs
// - PANASONIC: Panasonic ACs

// ============================================================
// GENERIC NEC CODES (Work with many brands)
// ============================================================

#define AC_NEC_POWER_ON       0x10AF8877
#define AC_NEC_POWER_OFF      0x10AF08F7
#define AC_NEC_TEMP_UP        0x10AF48B7
#define AC_NEC_TEMP_DOWN      0x10AFC837
#define AC_NEC_FAN_AUTO       0x10AF28D7
#define AC_NEC_FAN_LOW        0x10AFA857
#define AC_NEC_FAN_MED        0x10AF6897
#define AC_NEC_FAN_HIGH       0x10AFE817
#define AC_NEC_MODE_COOL      0x10AF906F
#define AC_NEC_MODE_FAN       0x10AFD02F
#define AC_NEC_MODE_DRY       0x10AF10EF
#define AC_NEC_MODE_AUTO      0x10AF50AF
#define AC_NEC_SWING_ON       0x10AF30CF
#define AC_NEC_SWING_OFF      0x10AFB04F

// ============================================================
// SAMSUNG AC CODES
// ============================================================

#define SAMSUNG_AC_POWER      0xE0E040BF
#define SAMSUNG_AC_TEMP_UP    0xE0E0D02F
#define SAMSUNG_AC_TEMP_DOWN  0xE0E050AF
#define SAMSUNG_AC_MODE       0xE0E0807F
#define SAMSUNG_AC_FAN        0xE0E0906F
#define SAMSUNG_AC_SWING      0xE0E0A05F

// ============================================================
// LG AC CODES
// ============================================================

#define LG_AC_POWER_ON        0x8800347
#define LG_AC_POWER_OFF       0x88C0051
#define LG_AC_TEMP_18         0x8808440
#define LG_AC_TEMP_19         0x8808541
#define LG_AC_TEMP_20         0x8808642
#define LG_AC_TEMP_21         0x8808743
#define LG_AC_TEMP_22         0x8808844
#define LG_AC_TEMP_23         0x8808945
#define LG_AC_TEMP_24         0x8808A46
#define LG_AC_TEMP_25         0x8808B47
#define LG_AC_TEMP_26         0x8808C48
#define LG_AC_TEMP_27         0x8808D49
#define LG_AC_TEMP_28         0x8808E4A

// ============================================================
// VOLTAS AC CODES (Uses COOLIX protocol)
// ============================================================

// Voltas typically uses COOLIX protocol
#define VOLTAS_POWER_ON       0xB24D7B84
#define VOLTAS_POWER_OFF      0xB27BE0
#define VOLTAS_TEMP_UP        0xB24D9F60
#define VOLTAS_TEMP_DOWN      0xB24D5FA0

// ============================================================
// DAIKIN AC CODES
// ============================================================

// Daikin uses a complex protocol with 35 bytes
// These are simplified toggle codes
#define DAIKIN_POWER          "ON/OFF toggle"
// Use IRremoteESP8266's Daikin class for full control

// ============================================================
// LLOYD / CARRIER AC CODES (COOLIX)
// ============================================================

#define LLOYD_POWER_ON        0xB24D7B84
#define LLOYD_POWER_OFF       0xB24D4BB4
#define LLOYD_SWING           0xB24DE01F

// ============================================================
// BLUE STAR AC CODES
// ============================================================

#define BLUESTAR_POWER        0x1FE48B7
#define BLUESTAR_TEMP_UP      0x1FE58A7
#define BLUESTAR_TEMP_DOWN    0x1FE7887

// ============================================================
// GODREJ AC CODES (GREE protocol)
// ============================================================

// Godrej often uses GREE protocol
#define GODREJ_POWER_ON       0x090000C0
#define GODREJ_POWER_OFF      0x090001C1

// ============================================================
// HELPER STRUCTURE FOR AC STATE
// ============================================================

typedef struct {
  bool power;
  uint8_t temperature;  // 16-30°C
  uint8_t mode;         // 0=auto, 1=cool, 2=dry, 3=fan, 4=heat
  uint8_t fan;          // 0=auto, 1=low, 2=med, 3=high
  bool swing;
  bool turbo;
  bool sleep;
} ACState;

// Mode definitions
#define AC_MODE_AUTO    0
#define AC_MODE_COOL    1
#define AC_MODE_DRY     2
#define AC_MODE_FAN     3
#define AC_MODE_HEAT    4

// Fan speed definitions
#define AC_FAN_AUTO     0
#define AC_FAN_LOW      1
#define AC_FAN_MED      2
#define AC_FAN_HIGH     3

// ============================================================
// NOTES FOR USERS
// ============================================================

/*
 * HOW TO FIND YOUR AC'S IR CODES:
 *
 * 1. Enable IR Learning Mode via MQTT:
 *    Publish to: home/{room}/ir_learn/command
 *    Payload: {"enable": true}
 *
 * 2. Point your AC remote at the ESP32's IR receiver
 *
 * 3. Press a button on your remote
 *
 * 4. The learned code will be published to:
 *    home/{room}/ir_learned/status
 *
 * 5. Save the code and use it in your automations
 *
 * EXAMPLE MQTT COMMAND TO SEND IR CODE:
 *
 * Topic: home/living_room/ac/command
 * Payload: {
 *   "code": "0x10AF8877",
 *   "protocol": "NEC",
 *   "bits": 32
 * }
 *
 * Or for raw codes:
 * Payload: {
 *   "code": "0x10AF8877",
 *   "protocol": "RAW",
 *   "raw": [8500, 4250, 550, 550, ...]  // Raw timing array
 * }
 */

#endif // AC_CODES_H

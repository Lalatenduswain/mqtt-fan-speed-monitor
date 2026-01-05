/*
 * Common TV IR Codes Library
 *
 * Contains IR codes for popular TV brands.
 * Use IR learning mode to capture your specific remote's codes.
 */

#ifndef TV_CODES_H
#define TV_CODES_H

// ============================================================
// SAMSUNG TV CODES (NEC protocol)
// ============================================================

#define SAMSUNG_TV_POWER        0xE0E040BF
#define SAMSUNG_TV_SOURCE       0xE0E0807F
#define SAMSUNG_TV_VOL_UP       0xE0E0E01F
#define SAMSUNG_TV_VOL_DOWN     0xE0E0D02F
#define SAMSUNG_TV_CH_UP        0xE0E048B7
#define SAMSUNG_TV_CH_DOWN      0xE0E008F7
#define SAMSUNG_TV_MUTE         0xE0E0F00F
#define SAMSUNG_TV_MENU         0xE0E058A7
#define SAMSUNG_TV_HOME         0xE0E09E61
#define SAMSUNG_TV_RETURN       0xE0E01AE5
#define SAMSUNG_TV_UP           0xE0E006F9
#define SAMSUNG_TV_DOWN         0xE0E08679
#define SAMSUNG_TV_LEFT         0xE0E0A659
#define SAMSUNG_TV_RIGHT        0xE0E046B9
#define SAMSUNG_TV_ENTER        0xE0E016E9

// Numeric keys
#define SAMSUNG_TV_0            0xE0E08877
#define SAMSUNG_TV_1            0xE0E020DF
#define SAMSUNG_TV_2            0xE0E0A05F
#define SAMSUNG_TV_3            0xE0E0609F
#define SAMSUNG_TV_4            0xE0E010EF
#define SAMSUNG_TV_5            0xE0E0906F
#define SAMSUNG_TV_6            0xE0E050AF
#define SAMSUNG_TV_7            0xE0E030CF
#define SAMSUNG_TV_8            0xE0E0B04F
#define SAMSUNG_TV_9            0xE0E0708F

// ============================================================
// LG TV CODES (NEC protocol)
// ============================================================

#define LG_TV_POWER             0x20DF10EF
#define LG_TV_INPUT             0x20DFD02F
#define LG_TV_VOL_UP            0x20DF40BF
#define LG_TV_VOL_DOWN          0x20DFC03F
#define LG_TV_CH_UP             0x20DF00FF
#define LG_TV_CH_DOWN           0x20DF807F
#define LG_TV_MUTE              0x20DF906F
#define LG_TV_HOME              0x20DF3EC1
#define LG_TV_SETTINGS          0x20DFC23D
#define LG_TV_BACK              0x20DF14EB
#define LG_TV_UP                0x20DF02FD
#define LG_TV_DOWN              0x20DF827D
#define LG_TV_LEFT              0x20DFE01F
#define LG_TV_RIGHT             0x20DF609F
#define LG_TV_OK                0x20DF22DD

// ============================================================
// SONY TV CODES (Sony protocol - 12/15/20 bit)
// ============================================================

#define SONY_TV_POWER           0xA90   // 12-bit
#define SONY_TV_VOL_UP          0x490
#define SONY_TV_VOL_DOWN        0xC90
#define SONY_TV_CH_UP           0x090
#define SONY_TV_CH_DOWN         0x890
#define SONY_TV_MUTE            0x290
#define SONY_TV_INPUT           0xA50
#define SONY_TV_HOME            0x70

// ============================================================
// MI TV / XIAOMI CODES (NEC protocol)
// ============================================================

#define MI_TV_POWER             0x807F02FD
#define MI_TV_VOL_UP            0x807F827D
#define MI_TV_VOL_DOWN          0x807FA25D
#define MI_TV_HOME              0x807F52AD
#define MI_TV_BACK              0x807FC23D
#define MI_TV_UP                0x807F629D
#define MI_TV_DOWN              0x807FE21D
#define MI_TV_LEFT              0x807F22DD
#define MI_TV_RIGHT             0x807FC03F
#define MI_TV_OK                0x807F42BD

// ============================================================
// TCL / THOMSON TV CODES (NEC protocol)
// ============================================================

#define TCL_TV_POWER            0x40040100BCBD
#define TCL_TV_VOL_UP           0x400401000405
#define TCL_TV_VOL_DOWN         0x400401008485
#define TCL_TV_SOURCE           0x400401009C9D

// ============================================================
// VU TV CODES (NEC protocol)
// ============================================================

#define VU_TV_POWER             0xFB04BF00
#define VU_TV_VOL_UP            0xFB0419E6
#define VU_TV_VOL_DOWN          0xFB0459A6
#define VU_TV_CH_UP             0xFB041BE4
#define VU_TV_CH_DOWN           0xFB045BA4
#define VU_TV_MUTE              0xFB0439C6
#define VU_TV_HOME              0xFB0441BE
#define VU_TV_BACK              0xFB0451AE

// ============================================================
// GENERIC TV CODES
// ============================================================

// These work with many no-brand Chinese TVs
#define GENERIC_TV_POWER        0x00FF629D
#define GENERIC_TV_VOL_UP       0x00FFA857
#define GENERIC_TV_VOL_DOWN     0x00FFE01F
#define GENERIC_TV_CH_UP        0x00FF22DD
#define GENERIC_TV_CH_DOWN      0x00FFC23D
#define GENERIC_TV_MUTE         0x00FF02FD

// ============================================================
// SET-TOP BOX CODES (Airtel, Tata Sky, etc.)
// ============================================================

// AIRTEL DTH
#define AIRTEL_POWER            0x1086900F
#define AIRTEL_CH_UP            0x1086D02F
#define AIRTEL_CH_DOWN          0x1086B04F
#define AIRTEL_VOL_UP           0x108650AF
#define AIRTEL_VOL_DOWN         0x1086708F
#define AIRTEL_OK               0x108620DF

// TATA SKY
#define TATASKY_POWER           0x00089B41
#define TATASKY_CH_UP           0x00085E51
#define TATASKY_CH_DOWN         0x0008DE51
#define TATASKY_OK              0x00080E51
#define TATASKY_MENU            0x00084451

// ============================================================
// HELPER STRUCTURE FOR TV CONTROL
// ============================================================

typedef struct {
  bool power;
  uint8_t volume;       // 0-100
  uint16_t channel;
  bool muted;
  uint8_t source;       // Input source index
} TVState;

// Source definitions
#define TV_SOURCE_TV        0
#define TV_SOURCE_HDMI1     1
#define TV_SOURCE_HDMI2     2
#define TV_SOURCE_HDMI3     3
#define TV_SOURCE_AV        4
#define TV_SOURCE_USB       5

// ============================================================
// NOTES FOR USERS
// ============================================================

/*
 * HOW TO CONTROL TV VIA MQTT:
 *
 * Topic: home/{room}/tv/command
 *
 * Power On/Off:
 * {"code": "0xE0E040BF", "protocol": "NEC", "bits": 32}
 *
 * Volume Up:
 * {"code": "0xE0E0E01F", "protocol": "NEC", "bits": 32}
 *
 * For repeated commands (like volume), send multiple times:
 * {"code": "0xE0E0E01F", "protocol": "NEC", "bits": 32, "repeat": 5}
 *
 * Note: Most TVs require 40-100ms between IR commands.
 */

#endif // TV_CODES_H

/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/contract.json`.
 */
export type Contract = {
  "address": "8Kns8bTCHGWYh2MUcYb4p7tK6subWE9jkyZiWq2T5Tn7",
  "metadata": {
    "name": "contract",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addCity",
      "discriminator": [
        106,
        38,
        63,
        145,
        13,
        126,
        52,
        154
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "oracleState",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "cityName",
          "type": "string"
        },
        {
          "name": "area",
          "type": "u64"
        },
        {
          "name": "circleRate",
          "type": "u64"
        },
        {
          "name": "country",
          "type": "string"
        }
      ]
    },
    {
      "name": "getCircleRate",
      "discriminator": [
        140,
        171,
        9,
        68,
        179,
        97,
        30,
        192
      ],
      "accounts": [
        {
          "name": "oracleState"
        }
      ],
      "args": [
        {
          "name": "cityName",
          "type": "string"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "getCityList",
      "discriminator": [
        233,
        91,
        42,
        99,
        3,
        243,
        122,
        234
      ],
      "accounts": [
        {
          "name": "oracleState"
        }
      ],
      "args": [],
      "returns": {
        "vec": {
          "defined": {
            "name": "circleInfo"
          }
        }
      }
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "oracleState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  97,
                  99,
                  108,
                  101,
                  45,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "adminSigner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "admin",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateCityRate",
      "discriminator": [
        99,
        245,
        199,
        63,
        142,
        114,
        136,
        163
      ],
      "accounts": [
        {
          "name": "admin",
          "signer": true
        },
        {
          "name": "oracleState",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "cityName",
          "type": "string"
        },
        {
          "name": "rate",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "oracleState",
      "discriminator": [
        97,
        156,
        157,
        189,
        194,
        73,
        8,
        15
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6001,
      "name": "cityNotSupported",
      "msg": "City not supported"
    },
    {
      "code": 6002,
      "name": "rateNotValid",
      "msg": "Rate not valid"
    },
    {
      "code": 6003,
      "name": "cityAlreadyExists",
      "msg": "City already exists"
    }
  ],
  "types": [
    {
      "name": "circleInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "cityName",
            "type": "string"
          },
          {
            "name": "rate",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "u64"
          },
          {
            "name": "country",
            "type": "string"
          },
          {
            "name": "area",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "oracleState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "circleRates",
            "type": {
              "vec": {
                "defined": {
                  "name": "circleInfo"
                }
              }
            }
          }
        ]
      }
    }
  ]
};

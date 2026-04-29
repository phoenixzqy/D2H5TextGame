# Loot Rate Simulation — Trash Acts

Simulation: 1000 fights per act, 3 trash mobs per fight, MF=0, GF=0, seeds 1..1000. The script mirrors `loadTreasureClasses()` item-entry filtering and `rollDrops()` rarity/no-drop semantics without a TS runtime.

| TC | mlvl | items/fight mean | std | fights ≥1 drop | 10-fight sample ≥1 drop | normal | magic | rare | set | unique | top bases |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| loot/trash-act1 | 1 | 1.223 | 0.835 | 79.70% | 99.99999% | 873 (71.38%) | 282 (23.06%) | 68 (5.56%) | 0 (0.00%) | 0 (0.00%) | belt-sash: 190<br>boot-leather: 170<br>wp1h-short-sword: 167<br>glove-leather: 159<br>armor-quilted: 124 |
| loot/trash-act2 | 21 | 1.223 | 0.835 | 79.70% | 99.99999% | 873 (71.38%) | 282 (23.06%) | 68 (5.56%) | 0 (0.00%) | 0 (0.00%) | belt-light: 165<br>wp1h-scimitar: 164<br>armor-leather: 161<br>boot-heavy: 148<br>glove-heavy: 141 |
| loot/trash-act3 | 35 | 1.223 | 0.835 | 79.70% | 99.99999% | 873 (71.38%) | 282 (23.06%) | 67 (5.48%) | 0 (0.00%) | 1 (0.08%) | belt-light: 178<br>boot-heavy: 164<br>glove-heavy: 153<br>wp1h-long-sword: 147<br>armor-chain-mail: 143 |
| loot/trash-act4 | 48 | 1.223 | 0.835 | 79.70% | 99.99999% | 873 (71.38%) | 282 (23.06%) | 68 (5.56%) | 0 (0.00%) | 0 (0.00%) | boot-mesh: 164<br>glove-bramble: 152<br>sh-monarch: 144<br>belt-mesh: 142<br>armor-dusk-shroud: 121 |
| loot/trash-act5 | 65 | 1.223 | 0.835 | 79.70% | 99.99999% | 873 (71.38%) | 282 (23.06%) | 66 (5.40%) | 0 (0.00%) | 2 (0.16%) | boot-mesh: 119<br>wp1h-phase-blade: 107<br>belt-spiderweb: 105<br>glove-bramble: 98<br>armor-dusk-shroud: 93 |

```json
[
  {
    "act": 1,
    "monsterLevel": 1,
    "fights": 1000,
    "kills": 3000,
    "itemCount": 1223,
    "itemsPerFightMean": 1.223,
    "itemsPerFightStd": 0.8350275444558691,
    "pFightHasDrop": 79.7,
    "pTenFightSampleHasDrop": 99.99998811606196,
    "rarity": {
      "normal": {
        "count": 873,
        "percent": 71.3818479149632
      },
      "magic": {
        "count": 282,
        "percent": 23.058053965658218
      },
      "rare": {
        "count": 68,
        "percent": 5.560098119378577
      },
      "set": {
        "count": 0,
        "percent": 0
      },
      "unique": {
        "count": 0,
        "percent": 0
      }
    },
    "topBases": [
      {
        "baseId": "items/base/belt-sash",
        "count": 190,
        "percent": 15.53556827473426
      },
      {
        "baseId": "items/base/boot-leather",
        "count": 170,
        "percent": 13.900245298446443
      },
      {
        "baseId": "items/base/wp1h-short-sword",
        "count": 167,
        "percent": 13.654946852003272
      },
      {
        "baseId": "items/base/glove-leather",
        "count": 159,
        "percent": 13.000817661488142
      },
      {
        "baseId": "items/base/armor-quilted",
        "count": 124,
        "percent": 10.139002452984466
      }
    ]
  },
  {
    "act": 2,
    "monsterLevel": 21,
    "fights": 1000,
    "kills": 3000,
    "itemCount": 1223,
    "itemsPerFightMean": 1.223,
    "itemsPerFightStd": 0.8350275444558691,
    "pFightHasDrop": 79.7,
    "pTenFightSampleHasDrop": 99.99998811606196,
    "rarity": {
      "normal": {
        "count": 873,
        "percent": 71.3818479149632
      },
      "magic": {
        "count": 282,
        "percent": 23.058053965658218
      },
      "rare": {
        "count": 68,
        "percent": 5.560098119378577
      },
      "set": {
        "count": 0,
        "percent": 0
      },
      "unique": {
        "count": 0,
        "percent": 0
      }
    },
    "topBases": [
      {
        "baseId": "items/base/belt-light",
        "count": 165,
        "percent": 13.49141455437449
      },
      {
        "baseId": "items/base/wp1h-scimitar",
        "count": 164,
        "percent": 13.409648405560098
      },
      {
        "baseId": "items/base/armor-leather",
        "count": 161,
        "percent": 13.164349959116924
      },
      {
        "baseId": "items/base/boot-heavy",
        "count": 148,
        "percent": 12.101390024529843
      },
      {
        "baseId": "items/base/glove-heavy",
        "count": 141,
        "percent": 11.529026982829109
      }
    ]
  },
  {
    "act": 3,
    "monsterLevel": 35,
    "fights": 1000,
    "kills": 3000,
    "itemCount": 1223,
    "itemsPerFightMean": 1.223,
    "itemsPerFightStd": 0.8350275444558691,
    "pFightHasDrop": 79.7,
    "pTenFightSampleHasDrop": 99.99998811606196,
    "rarity": {
      "normal": {
        "count": 873,
        "percent": 71.3818479149632
      },
      "magic": {
        "count": 282,
        "percent": 23.058053965658218
      },
      "rare": {
        "count": 67,
        "percent": 5.478331970564186
      },
      "set": {
        "count": 0,
        "percent": 0
      },
      "unique": {
        "count": 1,
        "percent": 0.08176614881439084
      }
    },
    "topBases": [
      {
        "baseId": "items/base/belt-light",
        "count": 178,
        "percent": 14.55437448896157
      },
      {
        "baseId": "items/base/boot-heavy",
        "count": 164,
        "percent": 13.409648405560098
      },
      {
        "baseId": "items/base/glove-heavy",
        "count": 153,
        "percent": 12.510220768601798
      },
      {
        "baseId": "items/base/wp1h-long-sword",
        "count": 147,
        "percent": 12.019623875715455
      },
      {
        "baseId": "items/base/armor-chain-mail",
        "count": 143,
        "percent": 11.692559280457889
      }
    ]
  },
  {
    "act": 4,
    "monsterLevel": 48,
    "fights": 1000,
    "kills": 3000,
    "itemCount": 1223,
    "itemsPerFightMean": 1.223,
    "itemsPerFightStd": 0.8350275444558691,
    "pFightHasDrop": 79.7,
    "pTenFightSampleHasDrop": 99.99998811606196,
    "rarity": {
      "normal": {
        "count": 873,
        "percent": 71.3818479149632
      },
      "magic": {
        "count": 282,
        "percent": 23.058053965658218
      },
      "rare": {
        "count": 68,
        "percent": 5.560098119378577
      },
      "set": {
        "count": 0,
        "percent": 0
      },
      "unique": {
        "count": 0,
        "percent": 0
      }
    },
    "topBases": [
      {
        "baseId": "items/base/boot-mesh",
        "count": 164,
        "percent": 13.409648405560098
      },
      {
        "baseId": "items/base/glove-bramble",
        "count": 152,
        "percent": 12.428454619787408
      },
      {
        "baseId": "items/base/sh-monarch",
        "count": 144,
        "percent": 11.774325429272281
      },
      {
        "baseId": "items/base/belt-mesh",
        "count": 142,
        "percent": 11.6107931316435
      },
      {
        "baseId": "items/base/armor-dusk-shroud",
        "count": 121,
        "percent": 9.893704006541292
      }
    ]
  },
  {
    "act": 5,
    "monsterLevel": 65,
    "fights": 1000,
    "kills": 3000,
    "itemCount": 1223,
    "itemsPerFightMean": 1.223,
    "itemsPerFightStd": 0.8350275444558691,
    "pFightHasDrop": 79.7,
    "pTenFightSampleHasDrop": 99.99998811606196,
    "rarity": {
      "normal": {
        "count": 873,
        "percent": 71.3818479149632
      },
      "magic": {
        "count": 282,
        "percent": 23.058053965658218
      },
      "rare": {
        "count": 66,
        "percent": 5.396565821749796
      },
      "set": {
        "count": 0,
        "percent": 0
      },
      "unique": {
        "count": 2,
        "percent": 0.1635322976287817
      }
    },
    "topBases": [
      {
        "baseId": "items/base/boot-mesh",
        "count": 119,
        "percent": 9.730171708912511
      },
      {
        "baseId": "items/base/wp1h-phase-blade",
        "count": 107,
        "percent": 8.748977923139819
      },
      {
        "baseId": "items/base/belt-spiderweb",
        "count": 105,
        "percent": 8.585445625511039
      },
      {
        "baseId": "items/base/glove-bramble",
        "count": 98,
        "percent": 8.013082583810302
      },
      {
        "baseId": "items/base/armor-dusk-shroud",
        "count": 93,
        "percent": 7.604251839738348
      }
    ]
  }
]
```

/* eslint-disable camelcase */
/* eslint-disable no-undef */
import * as site from './site_m.js';
import * as otoge from './const_m.js';

const PAGE_NAME = 'targetScore';

let mainGrid;
let fumens_data_raw;
let score_rate_data_raw;
let my_music_data_raw;

let target_score_key;

let updateFilterTimer;

let sort_click_count;
let sort_target;

let initializing = true;

const fumenFilter = (
  target,
  diff,
  medal,
  rank,
  score,
  version,
  lv,
  lv_type,
  target_percent,
  count,
) => {
  const res = alasql(`MATRIX OF
SELECT TBL1.[2] AS [0], TBL1.[1] AS [1], -- title/genre
TBL1.[3] AS [2], TBL1.[4] AS [3], -- lv-type/lv
TBL3.[1] AS [4], -- medal
TBL3.[2] AS [5], -- rank
CASE WHEN TBL3.[3] = -2 THEN 0 ELSE TBL3.[3] END AS [6], -- score
TBL1.[5] AS [7], -- version
TBL2.[1] AS [8], 
TBL2.[2] AS [9], 
TBL2.[3] AS [10], 
TBL2.[4] AS [11], 
TBL2.[5] AS [12], 
TBL2.[6] AS [13], 
TBL2.[7] AS [14],
TBL2.[9] AS [15] -- count
FROM ? AS TBL1
INNER JOIN ? AS TBL2 ON TBL2.[0] = TBL1.[0]
INNER JOIN ? AS TBL3 ON TBL3.[0] = TBL1.[0]`, [fumens_data_raw, score_rate_data_raw, my_music_data_raw]);

  let res2;
  if (target[0] === otoge.TARGET_SCORE_DATA.length - 1) {
    // get next target
    res2 = alasql(`MATRIX OF
SELECT 
TBL1.[0] AS [0], 
TBL1.[1] AS [1], 
TBL1.[2] AS [2], 
TBL1.[3] AS [3], 
TBL1.[4] AS [4], 
TBL1.[5] AS [5], 
TBL1.[6] AS [6], 
TBL1.[6] AS [7], -- dummy score
CASE 
WHEN TBL1.[6] < 85000 THEN TBL1.[8]
WHEN TBL1.[6] < 90000 THEN TBL1.[9]
WHEN TBL1.[6] < 95000 THEN TBL1.[10]
WHEN TBL1.[6] < 98000 THEN TBL1.[11]
WHEN TBL1.[6] < 99000 THEN TBL1.[12]
WHEN TBL1.[6] < 99400 THEN TBL1.[13]
WHEN TBL1.[6] < 100000 THEN TBL1.[14]
ELSE TBL1.[14] END AS [8],
CASE 
WHEN TBL1.[6] < 85000 THEN 4
WHEN TBL1.[6] < 90000 THEN 5
WHEN TBL1.[6] < 95000 THEN 6
WHEN TBL1.[6] < 98000 THEN 7
WHEN TBL1.[6] < 99000 THEN 8
WHEN TBL1.[6] < 99400 THEN 9
WHEN TBL1.[6] < 100000 THEN 10
ELSE 11 END AS [9], -- target score class
TBL1.[15] AS [10],
TBL1.[7] AS [11] -- version
FROM ? AS TBL1`, [res]);
  } else {
    // ${otoge.TARGET_SCORE_DATA_R[target[0]] + 4} is column number
    const test = `MATRIX OF
SELECT 
TBL1.[0] AS [0], 
TBL1.[1] AS [1], 
TBL1.[2] AS [2], 
TBL1.[3] AS [3], 
TBL1.[4] AS [4], 
TBL1.[5] AS [5], 
TBL1.[6] AS [6], 
TBL1.[6] AS [7], -- dummy score
CASE WHEN TBL1.[6] < 100000 THEN TBL1.[${otoge.TARGET_SCORE_DATA_R[target[0]] + 4}]
ELSE TBL1.[${otoge.TARGET_SCORE_DATA_R[6] + 4}] END AS [8],
${otoge.TARGET_SCORE_DATA_R[target[0]]} AS [9], -- target score 
TBL1.[15] AS [10],
TBL1.[7] AS [11] -- version
FROM ? AS TBL1`;
    res2 = alasql(test, [res]);
  }

  // add diff column
  const res3 = alasql(`MATRIX OF
SELECT 
TBL1.[0] AS [0], 
TBL1.[1] AS [1], 
TBL1.[2] AS [2], 
TBL1.[3] AS [3], 
TBL1.[4] AS [4], 
TBL1.[5] AS [5], 
TBL1.[6] AS [6], 
TBL1.[7] AS [7],
TBL1.[8] AS [8],
TBL1.[9] AS [9],

TBL1.[6] - CASE TBL1.[9]
WHEN 4 THEN 85000 
WHEN 5 THEN 90000 
WHEN 6 THEN 95000 
WHEN 7 THEN 98000 
WHEN 8 THEN 99000 
WHEN 9 THEN 99400 
ELSE 100000 END AS [10], -- diff
TBL1.[10] AS [11],
TBL1.[11] AS [12] -- version
FROM ? AS TBL1`, [res2]);

  let sql = 'MATRIX OF SELECT * FROM ?';
  let arg = [res3];
  if (diff[0] !== 0 || diff[1] !== otoge.DIFF_DATA.length - 1) {
    sql += (arg.length === 1) ? ' WHERE' : ' AND';
    sql += ' ? <= [10] AND [10] <= ?';
    arg = arg.concat([otoge.DIFF_DATA_R[diff[0]], otoge.DIFF_DATA_R[diff[1]]]);
  }
  if (medal[0] !== 0 || medal[1] !== otoge.MEDAL_DATA.length - 1) {
    sql += (arg.length === 1) ? ' WHERE' : ' AND';
    sql += ' ? <= [4] AND [4] <= ?';
    arg = arg.concat([otoge.MEDAL_DATA_R[medal[0]], otoge.MEDAL_DATA_R[medal[1]]]);
  }
  if (rank[0] !== 0 || rank[1] !== otoge.RANK_DATA.length - 1) {
    sql += (arg.length === 1) ? ' WHERE' : ' AND';
    sql += ' ? <= [5] AND [5] <= ?';
    arg = arg.concat([otoge.RANK_DATA_R[rank[0]], otoge.RANK_DATA_R[rank[1]]]);
  }
  if (score[0] !== 0 || score[1] !== otoge.SCORE_DATA.length - 1) {
    sql += (arg.length === 1) ? ' WHERE' : ' AND';
    sql += ' ? <= [6] AND [6] < ?';
    if (target[0] === otoge.TARGET_SCORE_DATA.length - 1) {
      // next
      arg = arg.concat([
        otoge.SCORE_DATA_R[score[0]],
        otoge.SCORE_DATA_R[score[1]]]);
    } else {
      // fix target
      arg = arg.concat([
        otoge.SCORE_DATA_R[score[0]],
        otoge.SCORE_DATA_R[score[1]] < otoge.SCORE_DATA_R[otoge.TARGET_SCORE_DATA_R[target[0]]]
          ? otoge.SCORE_DATA_R[score[1]] : otoge.SCORE_DATA_R[otoge.TARGET_SCORE_DATA_R[target[0]]],
      ]);
    }
  }

  if (version[0] !== 0) {
    sql += (arg.length === 1) ? ' WHERE' : ' AND';
    sql += ' [12] = ?';
    arg = arg.concat([otoge.VERSION_DATA_R[version[0]]]);
  }
  if (lv[0] !== 0 || lv[1] !== otoge.LV_DATA.length - 1) {
    sql += (arg.length === 1) ? ' WHERE' : ' AND';
    sql += ' ? <= [3] AND [3] <= ?';
    arg = arg.concat([lv[0] + 1, lv[1] + 1]); // +1 == to lv
  }
  if (lv_type[0] !== 0 || lv_type[1] !== otoge.LV_TYPE_DATA.length - 1) {
    sql += (arg.length === 1) ? ' WHERE' : ' AND';
    sql += ' ? <= [2] AND [2] <= ?';
    arg = arg.concat([lv_type[0] + 1, lv_type[1] + 1]); // +1 == to lv type
  }
  if (target_percent[0] !== 0
    || target_percent[1] !== otoge.TARGET_PERCENT_DATA.length - 1) {
    sql += (arg.length === 1) ? ' WHERE' : ' AND';
    sql += ' ? <= [8] AND [8] <= ?';
    arg = arg.concat([otoge.TARGET_PERCENT_DATA_R[target_percent[0]],
      otoge.TARGET_PERCENT_DATA_R[target_percent[1]]]);
  }
  if (count[0] !== 0
    || count[1] !== otoge.COUNT_DATA.length - 1) {
    sql += (arg.length === 1) ? ' WHERE' : ' AND';

    if (count[1] === otoge.COUNT_DATA.length - 1) {
      // ～∞
      sql += ' ? <= [11]';
      arg = arg.concat(otoge.COUNT_DATA_R[[count[0]]]);
    } else {
      sql += ' ? <= [11] AND [11] <= ?';
      arg = arg.concat([otoge.COUNT_DATA_R[count[0]],
        otoge.COUNT_DATA_R[count[1]]]);
    }
  }

  const res4 = alasql(sql, arg);

  // remove score class/version column
  const result = res4.map((a) => [a[0], a[1], a[2], a[3], a[4],
    a[5], a[6], a[7], a[8], a[10], a[11]]);

  return result;
};

// const onReady = (...args) => {
const onReady = () => {
  // page 移動, sort 変更のタイミングでも呼ばれる。
  // console.log('row: ' + JSON.stringify(args), args);
  const test = site.getCurrentSortStatus();
  // console.log(test);
  if (test[0]) {
    updateGrid2(true);
  }
};

// const storeSort = (...args) => {
const storeSort = () => {
  mainGrid.off('ready', storeSort);

  // console.log('row: ' + JSON.stringify(args), args);

  setTimeout(() => {
    [...Array(sort_click_count)].map(() => $(`.gridjs-th[data-column-id=${sort_target}]`).trigger('click'));
  }, 0);
};

const scoreToScoreClass = (score) => {
  if (score < 70000) {
    return 1;
  } if (score < 80000) {
    return 2;
  } if (score < 85000) {
    return 3;
  } if (score < 90000) {
    return 4;
  } if (score < 95000) {
    return 5;
  } if (score < 98000) {
    return 6;
  } if (score < 99000) {
    return 7;
  } if (score < 99400) {
    return 8;
  } if (score < 100000) {
    return 9;
  }
  return 10;
};

const updateGrid = (data) => {
  if (mainGrid === undefined) {
    mainGrid = new gridjs.Grid({
      columns: [
        {
          id: '0',
          name: 'genre',
          formatter: (_, row) => gridjs.html(`${row.cells[0].data}<br>${row.cells[1].data}`), /*
                          return gridjs.html((row.cells[0].data === row.cells[1].data) ?
                              row.cells[1].data :
                              (row.cells[0].data + ' / ' + row.cells[1].data));
                              */

          attributes: (cell) => {
            if (cell === null) {
              return undefined;
            }
            return {
              colspan: '2',
            };
          },
        },
        {
          id: '1',
          name: 'title',
          attributes: (cell) => {
            if (cell === null) {
              return undefined;
            }
            return {
              style: 'display:none',
            };
          },
        },
        {
          id: '2',
          name: '',
          sort: 0,
          width: '1px',
          attributes: {
            style: 'display:none',
          },
        },
        {
          id: '3',
          name: 'lv',
          attributes: (cell, row) => {
            if (cell === null) {
              return {
                colspan: '2',
              };
            }
            return {
              style: `background-color:${otoge.LV_TYPE_BACK_COLOR[row.cells[2].data]}; padding:0px; text-align: center`,
              colspan: '2',
            };
          },
        },
        {
          id: '4',
          name: 'm',
          attributes: (cell) => {
            if (cell === null) {
              return undefined;
            }
            return {
              style: 'display:none',
            };
          },
        },
        {
          id: '5',
          name: 'r',
          formatter: (_, row) => gridjs.html(`<img src="/icon/medal_${row.cells[4].data}.png" alt="${row.cells[4].data}" width="18" height="18" />`
                              + `<img src="/icon/rank_${row.cells[5].data}.png" alt="${row.cells[5].data}" width="18" height="18">`),
          attributes: (cell) => {
            if (cell === null) {
              return undefined;
            }
            return {
              colspan: '2',
            };
          },
        },
        {
          id: '6',
          name: 'score',
          formatter: (_, row) => row.cells[6].data,
          attributes: (cell) => {
            if (cell === null) {
              return undefined;
            }
            return {
              style: 'padding: 0px; text-align: center',
            };
          },
        },
        {
          id: '7',
          name: '→t',
          formatter: (_, row) => {
            let target_score_class = otoge.TARGET_SCORE_DATA_R[target_score_key];
            const now_score_class = scoreToScoreClass(row.cells[6].data);
            if (target_score_key === String(otoge.TARGET_SCORE_DATA.length - 1)) {
              if (now_score_class < 10) {
                target_score_class = now_score_class + 1;
              } else {
                target_score_class = 10;
              }
            }

            // const now_score_class_str = otoge.TARGET_SCORE_CLASS_DATA[now_score_class];
            let target_score_class_str = '';
            if (target_score_class <= 10) {
              // 85kから
              target_score_class_str = otoge.TARGET_SCORE_CLASS_DATA[
                target_score_class < 4 ? 4 : target_score_class];
            }

            // return now_score_class_str + '→' + target_score_class_str;
            return `→${target_score_class_str}`;
          },
          attributes: (cell) => {
            if (cell === null) {
              return undefined;
            }
            return {
              style: 'padding: 0px; text-align: center',
            };
          },
        },
        {
          id: '8',
          // important!
          name: gridjs.html('target<br>%'),
          formatter: (_, row) => (Number.isFinite(row.cells[8].data)
            ? row.cells[8].data.toFixed(2) : row.cells[8].data),
          sort: {
            compare: (a, b) => {
              const a_is_finite = Number.isFinite(a);
              const b_is_finite = Number.isFinite(b);
              if (!a_is_finite && !b_is_finite) {
                return 0;
              } if (!a_is_finite) {
                return 1;
              } if (!b_is_finite) {
                return -1;
              }
              if (a > b) {
                return 1;
              } if (a < b) {
                return -1;
              }
              return 0;
            },
          },
          attributes: (cell) => {
            if (cell === null) {
              return undefined;
            }
            return {
              style: 'padding:  0px 5px 0px 0px; text-align: right; font-family: monospace',
            };
          },
        },
        {
          id: '9',
          name: 'diff',
          formatter: (_, row) => (row.cells[9].data <= 0 ? row.cells[9].data : (`+${row.cells[9].data}`)),
          attributes: (cell) => {
            if (cell === null) {
              return undefined;
            }
            return {
              style: 'padding:  0px 5px 0px 0px; text-align: right; font-family: monospace',
            };
          },
        },
        {
          id: '10',
          name: 'c',
          formatter: (_, row) => row.cells[10].data,
          attributes: (cell) => {
            if (cell === null) {
              return {
                colspan: '2',
              };
            }
            return {
              style: 'padding:  0px 5px 0px 0px; text-align: right; font-family: monospace',
              colspan: '2',
            };
          },
        },
        {
          id: '11',
          name: '',
          sort: 0,
          width: '1px',
          attributes: {
            style: 'display:none',
          },
        },
      ],
      sort: true,
      search: true,
      pagination: {
        enabled: true,
        limit: 10,
      },
      style: {
        table: {
        },
        th: {
          padding: '0px',
          'text-align': 'center',
        },
        td: {
          padding: '0px',
          'text-align': 'center',
        },
      },
      language: {
        pagination: {
          previous: '←',
          next: '→',
        },
      },
      data,
    }).render(document.getElementById('wrapper'));

    mainGrid.on('ready', onReady);

    // 1st sort.
    [sort_target, sort_click_count] = site.getFilterSortStatus(PAGE_NAME, '8', 2);

    if (sort_click_count > 0) {
      mainGrid.on('ready', storeSort);
    }
  } else {
    [sort_target, sort_click_count] = site.getFilterSortStatus(PAGE_NAME, '8', 2);

    mainGrid.updateConfig({
      data,
    }).forceRender();

    if (sort_click_count > 0) {
      mainGrid.on('ready', storeSort);
    }
  }
};

function updateGrid2(filterSaveOnly) {
  let skipSlider;
  let val;

  skipSlider = document.getElementById('skipstep-target');
  val = skipSlider.noUiSlider.get();
  const key_target = Object.keys(otoge.TARGET_SCORE_DATA).filter(
    (key) => otoge.TARGET_SCORE_DATA[key] === val,
  )[0];

  // for column
  target_score_key = key_target;

  skipSlider = document.getElementById('skipstep-diff');
  val = skipSlider.noUiSlider.get();
  const key_diff1 = Object.keys(otoge.DIFF_DATA).filter(
    (key) => otoge.DIFF_DATA[key] === val[0],
  )[0];
  const key_diff2 = Object.keys(otoge.DIFF_DATA).filter(
    (key) => otoge.DIFF_DATA[key] === val[1],
  )[0];

  skipSlider = document.getElementById('skipstep-medal');
  val = skipSlider.noUiSlider.get();
  const key_medal1 = Object.keys(otoge.MEDAL_DATA).filter(
    (key) => otoge.MEDAL_DATA[key] === val[0],
  )[0];
  const key_medal2 = Object.keys(otoge.MEDAL_DATA).filter(
    (key) => otoge.MEDAL_DATA[key] === val[1],
  )[0];

  skipSlider = document.getElementById('skipstep-rank');
  val = skipSlider.noUiSlider.get();
  const key_rank1 = Object.keys(otoge.RANK_DATA).filter(
    (key) => otoge.RANK_DATA[key] === val[0],
  )[0];
  const key_rank2 = Object.keys(otoge.RANK_DATA).filter(
    (key) => otoge.RANK_DATA[key] === val[1],
  )[0];

  skipSlider = document.getElementById('skipstep-score');
  val = skipSlider.noUiSlider.get();
  const key_score1 = Object.keys(otoge.SCORE_DATA).filter(
    (key) => otoge.SCORE_DATA[key] === val[0],
  )[0];
  const key_score2 = Object.keys(otoge.SCORE_DATA).filter(
    (key) => otoge.SCORE_DATA[key] === val[1],
  )[0];

  skipSlider = document.getElementById('skipstep-version');
  val = skipSlider.noUiSlider.get();
  const key_version = Object.keys(otoge.VERSION_DATA).filter(
    (key) => otoge.VERSION_DATA[key] === val,
  )[0];

  skipSlider = document.getElementById('skipstep-lv');
  val = skipSlider.noUiSlider.get();
  const key_lv1 = Object.keys(otoge.LV_DATA).filter((key) => otoge.LV_DATA[key] === val[0])[0];
  const key_lv2 = Object.keys(otoge.LV_DATA).filter((key) => otoge.LV_DATA[key] === val[1])[0];

  skipSlider = document.getElementById('skipstep-lv-type');
  val = skipSlider.noUiSlider.get();
  const key_lv_type1 = Object.keys(otoge.LV_TYPE_DATA).filter(
    (key) => otoge.LV_TYPE_DATA[key] === val[0],
  )[0];
  const key_lv_type2 = Object.keys(otoge.LV_TYPE_DATA).filter(
    (key) => otoge.LV_TYPE_DATA[key] === val[1],
  )[0];

  skipSlider = document.getElementById('skipstep-target-percent');
  val = skipSlider.noUiSlider.get();
  const key_target_percent = [
    Object.keys(otoge.TARGET_PERCENT_DATA).filter(
      (k) => otoge.TARGET_PERCENT_DATA[k] === val[0],
    )[0],
    Object.keys(otoge.TARGET_PERCENT_DATA).filter(
      (k) => otoge.TARGET_PERCENT_DATA[k] === val[1],
    )[0]];

  skipSlider = document.getElementById('skipstep-count');
  val = skipSlider.noUiSlider.get();
  const key_count = [otoge.COUNT_DATA.indexOf(val[0]), otoge.COUNT_DATA.indexOf(val[1])];

  if (filterSaveOnly) {
    // save filter & sort
    const sortStatus = site.getCurrentSortStatus();

    const selectedFilter = window.localStorage.getItem(`${PAGE_NAME}.selectedFilter`) ?? '0';
    const prevFilters = JSON.parse(window.localStorage.getItem(`${PAGE_NAME}.filters`)) ?? {};
    prevFilters[selectedFilter] = {
      target: key_target,
      diff: [key_diff1, key_diff2],
      medal: [key_medal1, key_medal2],
      rank: [key_rank1, key_rank2],
      score: [key_score1, key_score2],
      version: key_version,
      lv: [key_lv1, key_lv2],
      lv_type: [key_lv_type1, key_lv_type2],
      target_percent: key_target_percent,
      count: key_count,
      sort: sortStatus,
    };

    window.localStorage.setItem(`${PAGE_NAME}.filters`, JSON.stringify(prevFilters));
  } else {
    const filteredData = fumenFilter(
      [key_target].map(Number),
      [key_diff1, key_diff2].map(Number),
      [key_medal1, key_medal2].map(Number),
      [key_rank1, key_rank2].map(Number),
      [key_score1, key_score2].map(Number),
      [key_version].map(Number),
      [key_lv1, key_lv2].map(Number),
      [key_lv_type1, key_lv_type2].map(Number),
      key_target_percent.map(Number),
      key_count.map(Number),
    );

    updateGrid(filteredData);
  }
}

if (document.querySelector('h1.nologin') !== null) {
  // no login
} else {
  document.getElementById('filter-selection').addEventListener('click', ({ target }) => {
    if (initializing === false && target.children[0].getAttribute('name') === 'btnradio') {
      // change filter
      const selectedFilter = target.children[0].id.replace('btnradio', '');
      window.localStorage.setItem(`${PAGE_NAME}.selectedFilter`, selectedFilter);
      // load filter
      const prevFilters = JSON.parse(window.localStorage.getItem(`${PAGE_NAME}.filters`));
      const prevFilter = (prevFilters === null
        || !Object.prototype.hasOwnProperty.call(prevFilters, selectedFilter))
        ? null
        : prevFilters[selectedFilter];

      Array.from(document.querySelectorAll('[id^=skipstep-]')).map(
        (skipSlider) => {
          if (skipSlider.noUiSlider !== undefined) {
            if (prevFilter === null) {
              skipSlider.noUiSlider.set(skipSlider.noUiSlider.options.default);
            } else {
              const filter = prevFilter[skipSlider.id.replace('skipstep-', '').replaceAll('-', '_')];
              const table = skipSlider.noUiSlider.options.matchingTable;
              if (Array.isArray(filter)) {
                skipSlider.noUiSlider.set([table[filter[0]], table[filter[1]]]);
              } else {
                skipSlider.noUiSlider.set(table[filter]);
              }
            }
          }

          return undefined;
        },
      );

      // change filter で local storage は更新しない。
      if (prevFilters === null) {
        window.localStorage.removeItem(`${PAGE_NAME}.filters`);
      } else {
        window.localStorage.setItem(`${PAGE_NAME}.filters`, JSON.stringify(prevFilters));
      }

      updateGrid2();
    }
  });

  document.getElementById('reset-button').addEventListener('click', () => {
    Array.from(document.querySelectorAll('[id^=skipstep-]')).map(
      (skipSlider) => skipSlider.noUiSlider.set(skipSlider.noUiSlider.options.default),
    );

    // remove filter
    const selectedFilter = window.localStorage.getItem(`${PAGE_NAME}.selectedFilter`) ?? '0';
    const prevFilters = JSON.parse(window.localStorage.getItem(`${PAGE_NAME}.filters`));
    if (prevFilters !== null) {
      if (Object.prototype.hasOwnProperty.call(prevFilters, selectedFilter)) {
        delete prevFilters[selectedFilter];
        if (Object.keys(prevFilters).length === 0) {
          window.localStorage.removeItem(`${PAGE_NAME}.filters`);
        } else {
          window.localStorage.setItem(`${PAGE_NAME}.filters`, JSON.stringify(prevFilters));
        }
      }
    }
    updateGrid2();
  });

  {
    // load filter
    const selectedFilter = window.localStorage.getItem(`${PAGE_NAME}.selectedFilter`) ?? '0';
    document.getElementById(`btnradio${selectedFilter}`).parentNode.click();
    const prevFilters = JSON.parse(window.localStorage.getItem(`${PAGE_NAME}.filters`));
    const prevFilter = (prevFilters === null
      || !Object.prototype.hasOwnProperty.call(prevFilters, selectedFilter))
      ? null
      : prevFilters[selectedFilter];

    {
      const skipSlider = document.getElementById('skipstep-target');
      const defaultPos = otoge.TARGET_SCORE_DATA[otoge.TARGET_SCORE_DATA.length - 1];
      const startPos = (prevFilter !== null && prevFilter.target !== undefined)
        ? otoge.TARGET_SCORE_DATA[prevFilter.target]
        : defaultPos;

      noUiSlider.create(skipSlider, {
        range: {
          min: 0,
          max: otoge.TARGET_SCORE_DATA.length - 1,
        },
        start: startPos,
        default: defaultPos,
        matchingTable: otoge.TARGET_SCORE_DATA,
        step: 1,
        tooltips: true,
        format: {
          to: (key) => otoge.TARGET_SCORE_DATA[Math.round(key)],
          from: (value) => Object.keys(otoge.TARGET_SCORE_DATA).filter(
            (key) => otoge.TARGET_SCORE_DATA[key] === value,
          )[0],
        },
      });

      const skipValues = [
        document.getElementById('target-text'),
      ];

      skipSlider.noUiSlider.on('update', (values, handle) => {
        skipValues[handle].innerHTML = values[handle];
      });

      skipSlider.noUiSlider.on('start', () => {
        clearTimeout(updateFilterTimer);
      });

      skipSlider.noUiSlider.on('set', () => {
        if (fumens_data_raw !== undefined && mainGrid !== undefined) {
          updateGrid2(true);
          clearTimeout(updateFilterTimer);
          updateFilterTimer = setTimeout(() => {
            updateGrid2();
          }, 1000);
        }
      });
    }
    {
      const skipSlider = document.getElementById('skipstep-diff');
      const defaultPos = [otoge.DIFF_DATA[0], -1];
      const startPos = (prevFilter !== null
        && prevFilter.diff !== undefined && prevFilter.diff.length === 2)
        ? [otoge.DIFF_DATA[prevFilter.diff[0]], otoge.DIFF_DATA[prevFilter.diff[1]]]
        : defaultPos;

      noUiSlider.create(skipSlider, {
        range: {
          min: 0,
          max: otoge.DIFF_DATA.length - 1,
        },
        connect: true,
        start: startPos,
        default: defaultPos,
        matchingTable: otoge.DIFF_DATA,
        step: 1,
        tooltips: [true, true],
        format: {
          to: (key) => otoge.DIFF_DATA[Math.round(key)],
          from: (value) => Object.keys(otoge.DIFF_DATA).filter(
            (key) => otoge.DIFF_DATA[key] === value,
          )[0],
        },
      });

      const skipValues = [
        document.getElementById('diff-lower'),
        document.getElementById('diff-upper'),
        document.getElementById('diff-hyphen'),
        document.getElementById('diff-same'),
      ];

      skipSlider.noUiSlider.on('update', (values, handle) => {
        skipValues[handle].innerHTML = values[handle];

        if (skipValues[0].innerHTML === skipValues[1].innerHTML) {
          skipValues[3].innerHTML = values[handle];
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else if ((skipValues[0].innerText === otoge.DIFF_DATA[0]
                  || skipValues[0].innerHTML === otoge.DIFF_DATA[0])
                  && (skipValues[1].innerText === otoge.DIFF_DATA[otoge.DIFF_DATA.length - 1]
                      || skipValues[1].innerHTML === otoge.DIFF_DATA[otoge.DIFF_DATA.length - 1])) {
          skipValues[3].innerHTML = 'ALL';
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else {
          skipValues[0].style.display = 'inline';
          skipValues[1].style.display = 'inline';
          skipValues[2].style.display = 'inline';
          skipValues[3].style.display = 'none';
        }
      });

      skipSlider.noUiSlider.on('start', () => {
        clearTimeout(updateFilterTimer);
      });

      skipSlider.noUiSlider.on('set', () => {
        if (fumens_data_raw !== undefined && mainGrid !== undefined) {
          updateGrid2(true);
          clearTimeout(updateFilterTimer);
          updateFilterTimer = setTimeout(() => {
            updateGrid2();
          }, 1000);
        }
      });
    }
    {
      const skipSlider = document.getElementById('skipstep-medal');
      const defaultPos = [otoge.MEDAL_DATA[0], otoge.MEDAL_DATA[otoge.MEDAL_DATA.length - 1]];
      const startPos = (prevFilter !== null
        && prevFilter.medal !== undefined && prevFilter.medal.length === 2)
        ? [otoge.MEDAL_DATA[prevFilter.medal[0]], otoge.MEDAL_DATA[prevFilter.medal[1]]]
        : defaultPos;

      noUiSlider.create(skipSlider, {
        range: {
          min: 0,
          max: otoge.MEDAL_DATA.length - 1,
        },
        connect: true,
        start: startPos,
        default: defaultPos,
        matchingTable: otoge.MEDAL_DATA,
        step: 1,
        tooltips: [true, true],
        format: {
          to: (key) => otoge.MEDAL_DATA[Math.round(key)],
          from: (value) => Object.keys(otoge.MEDAL_DATA).filter(
            (key) => otoge.MEDAL_DATA[key] === value,
          )[0],
        },
      });

      const skipValues = [
        document.getElementById('medal-lower'),
        document.getElementById('medal-upper'),
        document.getElementById('medal-hyphen'),
        document.getElementById('medal-same'),
      ];

      skipSlider.noUiSlider.on('update', (values, handle) => {
        skipValues[handle].innerHTML = values[handle];

        if (skipValues[0].innerHTML === skipValues[1].innerHTML) {
          skipValues[3].innerHTML = values[handle];
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else if ((skipValues[0].innerText === otoge.MEDAL_DATA[0]
                  || skipValues[0].innerHTML === otoge.MEDAL_DATA[0])
                  && (skipValues[1].innerText === otoge.MEDAL_DATA[otoge.MEDAL_DATA.length - 1]
                      || skipValues[1].innerHTML === otoge.MEDAL_DATA[
                        otoge.MEDAL_DATA.length - 1])) {
          skipValues[3].innerHTML = 'ALL';
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else {
          skipValues[0].style.display = 'inline';
          skipValues[1].style.display = 'inline';
          skipValues[2].style.display = 'inline';
          skipValues[3].style.display = 'none';
        }
      });

      skipSlider.noUiSlider.on('start', () => {
        clearTimeout(updateFilterTimer);
      });

      skipSlider.noUiSlider.on('set', () => {
        if (fumens_data_raw !== undefined && mainGrid !== undefined) {
          updateGrid2(true);
          clearTimeout(updateFilterTimer);
          updateFilterTimer = setTimeout(() => {
            updateGrid2();
          }, 1000);
        }
      });
    }
    {
      const skipSlider = document.getElementById('skipstep-rank');
      const defaultPos = [otoge.RANK_DATA[0], otoge.RANK_DATA[otoge.RANK_DATA.length - 1]];
      const startPos = (prevFilter !== null
        && prevFilter.rank !== undefined && prevFilter.rank.length === 2)
        ? [otoge.RANK_DATA[prevFilter.rank[0]], otoge.RANK_DATA[prevFilter.rank[1]]]
        : defaultPos;

      noUiSlider.create(skipSlider, {
        range: {
          min: 0,
          max: otoge.RANK_DATA.length - 1,
        },
        connect: true,
        start: startPos,
        default: defaultPos,
        matchingTable: otoge.RANK_DATA,
        step: 1,
        tooltips: [true, true],
        format: {
          to: (key) => otoge.RANK_DATA[Math.round(key)],
          from: (value) => Object.keys(otoge.RANK_DATA).filter(
            (key) => otoge.RANK_DATA[key] === value,
          )[0],
        },
      });

      const skipValues = [
        document.getElementById('rank-lower'),
        document.getElementById('rank-upper'),
        document.getElementById('rank-hyphen'),
        document.getElementById('rank-same'),
      ];

      skipSlider.noUiSlider.on('update', (values, handle) => {
        skipValues[handle].innerHTML = values[handle];

        if (skipValues[0].innerHTML === skipValues[1].innerHTML) {
          skipValues[3].innerHTML = values[handle];
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else if ((skipValues[0].innerText === otoge.RANK_DATA[0]
                  || skipValues[0].innerHTML === otoge.RANK_DATA[0])
                  && (skipValues[1].innerText === otoge.RANK_DATA[otoge.RANK_DATA.length - 1]
                      || skipValues[1].innerHTML === otoge.RANK_DATA[otoge.RANK_DATA.length - 1])) {
          skipValues[3].innerHTML = 'ALL';
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else {
          skipValues[0].style.display = 'inline';
          skipValues[1].style.display = 'inline';
          skipValues[2].style.display = 'inline';
          skipValues[3].style.display = 'none';
        }
      });

      skipSlider.noUiSlider.on('start', () => {
        clearTimeout(updateFilterTimer);
      });

      skipSlider.noUiSlider.on('set', () => {
        if (fumens_data_raw !== undefined && mainGrid !== undefined) {
          updateGrid2(true);
          clearTimeout(updateFilterTimer);
          updateFilterTimer = setTimeout(() => {
            updateGrid2();
          }, 1000);
        }
      });
    }
    {
      const skipSlider = document.getElementById('skipstep-score');
      const defaultPos = [otoge.SCORE_DATA[0], '100k'];
      const startPos = (prevFilter !== null
        && prevFilter.score !== undefined && prevFilter.score.length === 2)
        ? [otoge.SCORE_DATA[prevFilter.score[0]], otoge.SCORE_DATA[prevFilter.score[1]]]
        : defaultPos;

      noUiSlider.create(skipSlider, {
        range: {
          min: 0,
          max: otoge.SCORE_DATA.length - 1,
        },
        connect: true,
        // start: [otoge.SCORE_DATA[0], otoge.SCORE_DATA[otoge.SCORE_DATA.length - 1]],
        start: startPos,
        default: defaultPos,
        matchingTable: otoge.SCORE_DATA,
        step: 1,
        margin: 1,
        tooltips: [true, true],
        format: {
          to: (key) => otoge.SCORE_DATA[Math.round(key)],
          from: (value) => Object.keys(otoge.SCORE_DATA).filter(
            (key) => otoge.SCORE_DATA[key] === value,
          )[0],
        },
      });

      const skipValues = [
        document.getElementById('score-lower'),
        document.getElementById('score-upper'),
        document.getElementById('score-line'),
        document.getElementById('score-same'),
      ];

      skipSlider.noUiSlider.on('update', (values, handle) => {
        const key_score = Object.keys(otoge.SCORE_DATA).filter(
          (key) => otoge.SCORE_DATA[key] === values[handle],
        )[0];

        skipValues[handle].innerHTML = otoge.SCORE_DATA_DISPLAY[key_score];

        if (values[0] === otoge.SCORE_DATA[0]
                  && values[1] === otoge.SCORE_DATA[otoge.SCORE_DATA.length - 1]) {
          skipValues[3].innerHTML = 'ALL';
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else {
          skipValues[0].style.display = 'inline';
          skipValues[1].style.display = 'inline';
          skipValues[2].style.display = 'inline';
          if (values[1] === otoge.SCORE_DATA[otoge.SCORE_DATA.length - 1]) {
            skipValues[2].innerHTML = '<img src="/icon/closed.png" alt="closed"  width="20" height="10"/>';
          } else {
            skipValues[2].innerHTML = '<img src="/icon/leftclosed.png" alt="leftclosed"  width="20" height="10"/>';
          }
          skipValues[3].style.display = 'none';
        }
      });

      skipSlider.noUiSlider.on('start', () => {
        clearTimeout(updateFilterTimer);
      });

      skipSlider.noUiSlider.on('set', () => {
        if (fumens_data_raw !== undefined && mainGrid !== undefined) {
          updateGrid2(true);
          clearTimeout(updateFilterTimer);
          updateFilterTimer = setTimeout(() => {
            updateGrid2();
          }, 1000);
        }
      });
    }
    {
      const skipSlider = document.getElementById('skipstep-version');
      const defaultPos = otoge.VERSION_DATA[0];
      const startPos = (prevFilter !== null && prevFilter.version !== undefined)
        ? otoge.VERSION_DATA[prevFilter.version]
        : defaultPos;

      noUiSlider.create(skipSlider, {
        range: {
          min: 0,
          max: otoge.VERSION_DATA.length - 1,
        },
        start: startPos,
        default: defaultPos,
        matchingTable: otoge.VERSION_DATA,
        step: 1,
        tooltips: true,
        format: {
          to: (key) => otoge.VERSION_DATA[Math.round(key)],
          from: (value) => Object.keys(otoge.VERSION_DATA).filter(
            (key) => otoge.VERSION_DATA[key] === value,
          )[0],
        },
      });

      const skipValues = [
        document.getElementById('version-text'),
      ];

      skipSlider.noUiSlider.on('update', (values, handle) => {
        skipValues[handle].innerHTML = values[handle];
      });

      skipSlider.noUiSlider.on('start', () => {
        clearTimeout(updateFilterTimer);
      });

      skipSlider.noUiSlider.on('set', () => {
        if (fumens_data_raw !== undefined && mainGrid !== undefined) {
          updateGrid2(true);
          clearTimeout(updateFilterTimer);
          updateFilterTimer = setTimeout(() => {
            updateGrid2();
          }, 1000);
        }
      });
    }
    {
      const skipSlider = document.getElementById('skipstep-lv');
      const defaultPos = [otoge.LV_DATA[0], otoge.LV_DATA[otoge.LV_DATA.length - 1]];
      const startPos = (prevFilter !== null
        && prevFilter.lv !== undefined && prevFilter.lv.length === 2)
        ? [otoge.LV_DATA[prevFilter.lv[0]], otoge.LV_DATA[prevFilter.lv[1]]]
        : defaultPos;

      noUiSlider.create(skipSlider, {
        range: {
          min: 0,
          max: otoge.LV_DATA.length - 1,
        },
        connect: true,
        start: startPos,
        default: defaultPos,
        matchingTable: otoge.LV_DATA,
        step: 1,
        tooltips: [true, true],
        format: {
          to: (key) => otoge.LV_DATA[Math.round(key)],
          from: (value) => Object.keys(otoge.LV_DATA).filter(
            (key) => otoge.LV_DATA[key] === value,
          )[0],
        },
      });

      const skipValues = [
        document.getElementById('lv-lower'),
        document.getElementById('lv-upper'),
        document.getElementById('lv-hyphen'),
        document.getElementById('lv-same'),
      ];

      skipSlider.noUiSlider.on('update', (values, handle) => {
        skipValues[handle].innerHTML = values[handle];

        if (skipValues[0].innerHTML === skipValues[1].innerHTML) {
          skipValues[3].innerHTML = values[handle];
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else if (skipValues[0].innerText === otoge.LV_DATA[0]
                  && skipValues[1].innerText === otoge.LV_DATA[otoge.LV_DATA.length - 1]) {
          skipValues[3].innerHTML = 'ALL';
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else {
          skipValues[0].style.display = 'inline';
          skipValues[1].style.display = 'inline';
          skipValues[2].style.display = 'inline';
          skipValues[3].style.display = 'none';
        }
      });

      skipSlider.noUiSlider.on('start', () => {
        clearTimeout(updateFilterTimer);
      });

      skipSlider.noUiSlider.on('set', () => {
        if (fumens_data_raw !== undefined && mainGrid !== undefined) {
          updateGrid2(true);
          clearTimeout(updateFilterTimer);
          updateFilterTimer = setTimeout(() => {
            updateGrid2();
          }, 1000);
        }
      });
    }
    {
      const skipSlider = document.getElementById('skipstep-lv-type');
      const defaultPos = [otoge.LV_TYPE_DATA[0], otoge.LV_TYPE_DATA[otoge.LV_TYPE_DATA.length - 1]];
      const startPos = (prevFilter !== null
        && prevFilter.lv_type !== undefined && prevFilter.lv_type.length === 2)
        ? [otoge.LV_TYPE_DATA[prevFilter.lv_type[0]], otoge.LV_TYPE_DATA[prevFilter.lv_type[1]]]
        : defaultPos;

      noUiSlider.create(skipSlider, {
        range: {
          min: 0,
          max: otoge.LV_TYPE_DATA.length - 1,
        },
        connect: true,
        start: startPos,
        default: defaultPos,
        matchingTable: otoge.LV_TYPE_DATA,
        step: 1,
        tooltips: [true, true],
        format: {
          to: (key) => otoge.LV_TYPE_DATA[Math.round(key)],
          from: (value) => Object.keys(otoge.LV_TYPE_DATA).filter(
            (key) => otoge.LV_TYPE_DATA[key] === value,
          )[0],
        },
      });

      const skipValues = [
        document.getElementById('lv-type-lower'),
        document.getElementById('lv-type-upper'),
        document.getElementById('lv-type-hyphen'),
        document.getElementById('lv-type-same'),
      ];

      skipSlider.noUiSlider.on('update', (values, handle) => {
        skipValues[handle].innerHTML = values[handle];

        if (skipValues[0].innerHTML === skipValues[1].innerHTML) {
          skipValues[3].innerHTML = values[handle];
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else if (skipValues[0].innerText === otoge.LV_TYPE_DATA[0]
                  && skipValues[1].innerText === otoge.LV_TYPE_DATA[
                    otoge.LV_TYPE_DATA.length - 1]) {
          skipValues[3].innerHTML = 'ALL';
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else {
          skipValues[0].style.display = 'inline';
          skipValues[1].style.display = 'inline';
          skipValues[2].style.display = 'inline';
          skipValues[3].style.display = 'none';
        }
      });

      skipSlider.noUiSlider.on('start', () => {
        clearTimeout(updateFilterTimer);
      });

      skipSlider.noUiSlider.on('set', () => {
        if (fumens_data_raw !== undefined && mainGrid !== undefined) {
          updateGrid2(true);
          clearTimeout(updateFilterTimer);
          updateFilterTimer = setTimeout(() => {
            updateGrid2();
          }, 1000);
        }
      });
    }
    {
      const skipSlider = document.getElementById('skipstep-target-percent');
      const defaultPos = [otoge.TARGET_PERCENT_DATA[0],
        otoge.TARGET_PERCENT_DATA[otoge.TARGET_PERCENT_DATA.length - 1]];
      const startPos = (prevFilter !== null
        && prevFilter.target_percent !== undefined
        && prevFilter.target_percent.length === 2)
        ? [otoge.TARGET_PERCENT_DATA[prevFilter.target_percent[0]],
          otoge.TARGET_PERCENT_DATA[prevFilter.target_percent[1]]]
        : defaultPos;

      noUiSlider.create(skipSlider, {
        range: {
          min: 0,
          max: otoge.TARGET_PERCENT_DATA.length - 1,
        },
        connect: true,
        start: startPos,
        default: defaultPos,
        matchingTable: otoge.TARGET_PERCENT_DATA,
        step: 1,
        margin: 1,
        tooltips: [true, true],
        format: {
          to: (key) => otoge.TARGET_PERCENT_DATA[Math.round(key)],
          from: (value) => Object.keys(otoge.TARGET_PERCENT_DATA).filter(
            (key) => otoge.TARGET_PERCENT_DATA[key] === value,
          )[0],
        },
      });

      const skipValues = [
        document.getElementById('target-percent-lower'),
        document.getElementById('target-percent-upper'),
        document.getElementById('target-percent-hyphen'),
        document.getElementById('target-percent-same'),
      ];

      skipSlider.noUiSlider.on('update', (values, handle) => {
        skipValues[handle].innerHTML = values[handle];

        if (skipValues[0].innerHTML === skipValues[1].innerHTML) {
          skipValues[3].innerHTML = values[handle];
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else if (values[0] === otoge.TARGET_PERCENT_DATA[0]
            && values[1] === otoge.TARGET_PERCENT_DATA[
              otoge.TARGET_PERCENT_DATA.length - 1]) {
          skipValues[3].innerHTML = 'ALL';
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else {
          skipValues[0].style.display = 'inline';
          skipValues[1].style.display = 'inline';
          skipValues[2].style.display = 'inline';
          skipValues[3].style.display = 'none';
        }
      });

      skipSlider.noUiSlider.on('start', () => {
        clearTimeout(updateFilterTimer);
      });

      skipSlider.noUiSlider.on('set', () => {
        if (fumens_data_raw !== undefined && mainGrid !== undefined) {
          updateGrid2(true);
          clearTimeout(updateFilterTimer);
          updateFilterTimer = setTimeout(() => {
            updateGrid2();
          }, 1000);
        }
      });
    }
    {
      const skipSlider = document.getElementById('skipstep-count');
      const defaultPos = [otoge.COUNT_DATA[0],
        otoge.COUNT_DATA[otoge.COUNT_DATA.length - 1]];
      const startPos = (prevFilter !== null
        && prevFilter.count !== undefined
        && prevFilter.count.length === 2)
        ? [otoge.COUNT_DATA[prevFilter.count[0]],
          otoge.COUNT_DATA[prevFilter.count[1]]]
        : defaultPos;

      noUiSlider.create(skipSlider, {
        range: {
          min: 0,
          max: otoge.COUNT_DATA.length - 1,
        },
        connect: true,
        start: startPos,
        default: defaultPos,
        matchingTable: otoge.COUNT_DATA,
        step: 1,
        margin: 1,
        tooltips: [true, true],
        format: {
          to: (key) => otoge.COUNT_DATA[Math.round(key)],
          from: (value) => Object.keys(otoge.COUNT_DATA).filter(
            (key) => otoge.COUNT_DATA[key] === value,
          )[0],
        },
      });

      const skipValues = [
        document.getElementById('count-lower'),
        document.getElementById('count-upper'),
        document.getElementById('count-hyphen'),
        document.getElementById('count-same'),
      ];

      skipSlider.noUiSlider.on('update', (values, handle) => {
        skipValues[handle].innerHTML = values[handle];

        if (skipValues[0].innerHTML === skipValues[1].innerHTML) {
          skipValues[3].innerHTML = values[handle];
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else if (values[0] === otoge.COUNT_DATA[0]
            && values[1] === otoge.COUNT_DATA[
              otoge.COUNT_DATA.length - 1]) {
          skipValues[3].innerHTML = 'ALL';
          skipValues[0].style.display = 'none';
          skipValues[1].style.display = 'none';
          skipValues[2].style.display = 'none';
          skipValues[3].style.display = 'inline';
        } else {
          skipValues[0].style.display = 'inline';
          skipValues[1].style.display = 'inline';
          skipValues[2].style.display = 'inline';
          skipValues[3].style.display = 'none';
        }
      });

      skipSlider.noUiSlider.on('start', () => {
        clearTimeout(updateFilterTimer);
      });

      skipSlider.noUiSlider.on('set', () => {
        if (fumens_data_raw !== undefined && mainGrid !== undefined) {
          updateGrid2(true);
          clearTimeout(updateFilterTimer);
          updateFilterTimer = setTimeout(() => {
            updateGrid2();
          }, 1000);
        }
      });
    }
  }

  $.getJSON('/api/mymusic', (my_music_data) => {
    $.getJSON('/api/globalscorerate', (score_rate_data) => {
      $.getJSON('/api/fumens', (fumens_data) => {
        fumens_data_raw = fumens_data;
        score_rate_data_raw = score_rate_data;
        my_music_data_raw = my_music_data;

        updateGrid2();
      });
    });
  });

  initializing = false;
}

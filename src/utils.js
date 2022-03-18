export const $ = (selector, scope = document) => scope.querySelector(selector);

export const $on = (target, type, callback, capture) => target.addEventListener(type, callback, !!capture);

export const ce = tag => document.createElement(tag);

export const createRow = (title, arr) => {
    const $tr = ce('tr');

    const $th = ce('th');
    $th.textContent = title;
    $tr.appendChild($th);

    for (const v of arr) {
        const $td = ce('td');
        $td.textContent = typeof v === 'number' ? round(v) : v;
        $tr.appendChild($td);
    }
    return $tr;
};

export const updateTable = (id, data) => {
    const $tbody = $(id);
    $tbody.innerHTML = '';

    for (const r of data) {
        const $tr = createRow(r.title, r.values);
        $tbody.appendChild($tr);
    }
};

export const round = (x, n = 4) => x.toFixed(n);

export const min = arr => Math.min(...arr);

export const max = arr => Math.max(...arr);

export const rand = Math.random;

export const computeStats = arr => {
    const n = arr.length;

    const min = Math.min(...arr);
    const max = Math.max(...arr);

    const sum = arr.reduce((sum, x) => sum + x, 0);
    const mx = sum / n;

    const sum2 = arr.reduce((sum, x) => sum + Math.pow(x - mx, 2), 0);
    const dx = sum2 / (n - 1);

    return { mx, dx, min, max };
};

export const countSeq = arr => {
    const k = Math.ceil(1 + 3.222 * Math.log10(arr.length));
    const aMin = min(arr),
        aMax = max(arr);
    const diff = (aMax - aMin) / k;

    const intervals = [];
    for (let i = 0; i < k; i++) {
        intervals.push({ from: aMin + diff * i, to: aMin + diff * (i + 1), n: 0 });
    }

    for (const v of arr) {
        for (const span of intervals) {
            if (span.from <= v && v < span.to) {
                span.n++;
            }
        }
    }

    return intervals;
};

export const generateSeq = (n, fn) =>
    Array.from({ length: n }, fn)
        .flat()
        .slice(0, n)
        .sort((a, b) => a - b);

export const bellDist = (u, o) => {
    while (true) {
        const v1 = 2 * rand() - 1,
            v2 = 2 * rand() - 1;

        const s = v1 * v1 + v2 * v2;
        if (s <= 1) {
            const sq = Math.sqrt((-2 * Math.log(s)) / s);
            const r1 = v1 * sq;
            const r2 = v2 * sq;
            return [u + o * r1, u + o * r2];
        }
    }
};

export const uniformDist = (min, max) => rand() * (max - min) + min;

export const uniformStats = (min, max) => ({ mx: (max + min) / 2, dx: Math.pow(max - min, 2) / 12 });

export const exponentialDist = (A = 1) => -Math.log(rand()) / A;

export const exponentialStats = (A = 1) => ({ mx: Math.pow(A, -1), dx: Math.pow(A, -2) });

export const normalDist = (u, o) => {
    let s = 0;
    for (let i = 0; i < 12; i++) {
        s += rand();
    }
    return u + o * (s - 6);
};

export const normalStats = (u, o) => ({ mx: u, dx: o * o });

const SQRT_2PI = Math.sqrt(2 * Math.PI);
const round4 = x => Math.round(x * 1e4) / 1e4;

function cumulativeDistribution(z) {
    let sum = z,
        tmp = z;

    // 15 iterations are enough for 4-digit precision
    for (let i = 1; i < 15; i++) {
        tmp *= (z * z) / (2 * i + 1);
        sum += tmp;
    }
    return round4(0.5 + (sum / SQRT_2PI) * Math.exp((-z * z) / 2));
}

export const ksTest = (arr, u, o, a) => {
    const n = arr.length;
    const sq = Math.sqrt((n * n) / (n + n));

    const max = Math.max(
        ...arr.map((x, i) => {
            const F = (i + 1) / n;
            const Fn = cumulativeDistribution(round4((x - u) / o));
            return Math.abs(F - Fn);
        })
    );

    return {
        ka: Math.sqrt(-Math.log((1 - a) / 2) / 2),
        value: sq * max,
    };
};

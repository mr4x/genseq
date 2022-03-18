import { Chart } from 'frappe-charts/dist/frappe-charts.esm';

import { V } from './data';
import {
    uniformDist,
    normalDist,
    exponentialDist,
    generateSeq,
    $on,
    $,
    min,
    max,
    round,
    countSeq,
    computeStats,
    updateTable,
    uniformStats,
    normalStats,
    exponentialStats,
    bellDist,
    ksTest,
} from './utils';

function createChart(id, title, seqLen, fn) {
    const seq = generateSeq(seqLen, fn);
    const count = countSeq(seq);

    return {
        seq,
        count,
        chart: new Chart(id, {
            title,
            type: 'bar',
            height: 300,
            data: {
                labels: count.map((_, i) => i + 1),
                datasets: [{ name: 'x', type: 'bar', values: count.map(x => x.n) }],
            },
            tooltipOptions: {
                formatTooltipX: x => {
                    const span = count[x - 1];
                    return `от ${round(span.from, 4)} до ${round(span.to, 4)}`;
                },
            },
        }),
    };
}

function createStats(tableId, chartId, fn, stats) {
    const x10 = generateSeq(10, fn);
    const s10 = computeStats(x10);

    const x20 = generateSeq(20, fn);
    const s20 = computeStats(x20);

    const x50 = generateSeq(50, fn);
    const s50 = computeStats(x50);

    const x100 = generateSeq(100, fn);
    const s100 = computeStats(x100);

    const x1000 = generateSeq(1000, fn);
    const s1000 = computeStats(x1000);

    const mxSeq = [s10.mx, s20.mx, s50.mx, s100.mx, s1000.mx];
    const dxSeq = [s10.dx, s20.dx, s50.dx, s100.dx, s1000.dx];

    updateTable(tableId, [
        { title: 'Минимум', values: [s10.min, s20.min, s50.min, s100.min, s1000.min] },
        { title: 'Максимум', values: [s10.max, s20.max, s50.max, s100.max, s1000.max] },
        { title: 'M(X)', values: mxSeq },
        { title: 'M(X) теор', values: generateSeq(5, () => stats.mx) },
        { title: 'M(X) разн %', values: mxSeq.map(x => 100*Math.abs(stats.mx - x) / x) },
        { title: 'D(X)', values: dxSeq },
        { title: 'D(X) теор', values: generateSeq(5, () => stats.dx) },
        { title: 'D(X) разн %', values: dxSeq.map(x => 100*Math.abs(stats.dx - x) / x) },
    ]);

    new Chart(chartId, {
        title: 'Зависимость M(X) и D(X) от размера выборки',
        type: 'line',
        height: 300,
        axisOptions: {
            yAxisMode: 'tick',
        },
        data: {
            labels: [10, 20, 50, 100, 1000],
            datasets: [
                { name: 'M(X)', type: 'line', values: mxSeq },
                { name: 'D(X)', type: 'line', values: dxSeq },
            ],
            yMarkers: [
                {
                    label: 'M(X)',
                    value: stats.mx,
                    options: { labelPos: 'left' },
                },
                {
                    label: 'D(X)',
                    value: stats.dx,
                },
            ],
        },
    });
}

function computeVariant(vIndex) {
    const data = V[vIndex];
    $('#a').textContent = data.a;
    $('#b').textContent = data.b;
    $('#A').textContent = data.A;
    $('#u').textContent = data.u;
    $('#o').textContent = data.o;

    const seqLen = 1000;

    const uFn = () => uniformDist(data.a, data.b);
    const uStats = uniformStats(data.a, data.b);
    createChart('#u1000', 'Равномерное распределение', seqLen, uFn);
    createStats('#uTable', '#uStats', uFn, uStats);

    const bFn = () => bellDist(data.u, data.o);
    const bStats = normalStats(data.u, data.o);
    const bChart = createChart('#b1000', 'Нормальное распределение (алгоритм Белла)', seqLen, bFn);
    createStats('#bTable', '#bStats', bFn, bStats);

    const b01 = ksTest(bChart.seq, data.u, data.o, 0.1);
    const b005 = ksTest(bChart.seq, data.u, data.o, 0.05);
    updateTable('#bTest', [
        { title: '0.1', values: [b01.ka, b01.value, b01.value < b01.ka] },
        { title: '0.05', values: [b005.ka, b005.value, b005.value < b005.ka] },
    ]);

    const nFn = () => normalDist(data.u, data.o);
    const nStats = normalStats(data.u, data.o);
    const nChart = createChart('#n1000', 'Нормальное распределение', seqLen, nFn);
    createStats('#nTable', '#nStats', nFn, nStats);

    const n01 = ksTest(nChart.seq, data.u, data.o, 0.1);
    const n005 = ksTest(nChart.seq, data.u, data.o, 0.05);
    updateTable('#nTest', [
        { title: '0.1', values: [n01.ka, n01.value, n01.value < n01.ka] },
        { title: '0.05', values: [n005.ka, n005.value, n005.value < n005.ka] },
    ]);

    const eFn = () => exponentialDist(data.A);
    const eStats = exponentialStats(data.A);
    createChart('#e1000', 'Экспоненциальное распределение', seqLen, eFn);
    createStats('#eTable', '#eStats', eFn, eStats);
}
computeVariant(0);

$on($('#variant'), 'change', ev => {
    const $el = ev.target;
    const $option = $el.options[$el.selectedIndex];
    computeVariant(+$option.value);
});

import { createRoot, createState, createEffect, onCleanup, sample } from 'solid-js';

import { StoreInterface, DataFetchOptions, TableData, ColumnData } from "./store";
import { Dropdown } from "./Dropdown";

import * as echarts from "echarts";
import { ECharts } from "echarts";

declare global {
  namespace JSX {
    interface HTMLAttributes<T> {
      onconnected?: () => void
      ondisconnected?: () => void
    }
  }
}

export interface PlotWrapperProps {
  plotData?: any
}

/*
function PlotWrapper(props: PlotWrapperProps) {
  let el: HTMLDivElement = null!;
  let chart: ECharts = null!;

  const [state, setState] = createState({
    cachedPlotData: null,
  })

  createEffect(() => {
    // effect to monitor changes to props.plotData
    let newPlotData = props.plotData;

    if (newPlotData != null) {
      setState({cachedPlotData: newPlotData});
    }
  })

  setInterval(() => {
    if (chart == null) {
      chart = echarts.init(el as HTMLDivElement);
    }

    if (state.cachedPlotData != null && document.body.contains(el)) {
      chart.setOption(state.cachedPlotData!)
      setState({cachedPlotData: null})
    }
    document.body.contains(el)
  }, 100)

  return (
    <div
      ref={el}
      style="width: 600px;height:400px;"
    ></div>
  )
}
*/


function PlotWrapper(props: PlotWrapperProps) {
  let el: HTMLDivElement = null!;
  let chart: ECharts = null!;

  const [state, setState] = createState({
    mounted: false,
    cachedPlotData: null,
  })

  let updatePlot = (plotData: any) => {
    if (chart == null) {
      chart = echarts.init(el as HTMLDivElement);
    }
    console.log("updating plot with:", plotData)
    chart.setOption(plotData)
  }

  createEffect(() => {
    // effect to monitor changes to props.plotData
    let newPlotData = props.plotData;
    if (sample(() => state.mounted)) {
      // already mounted => we can call into the external lib directly
      updatePlot(newPlotData)
    } else {
      // not mounted => need to cache
      setState({cachedPlotData: newPlotData});
    }
  })

  let onMounted = () => {
    if (state.cachedPlotData != null) {
      updatePlot(state.cachedPlotData!)
      setState({cachedPlotData: null});
    }
    setState({mounted: true})
 }

  let onUnmounted = () => {
    setState({mounted: false})
  }

  return (
    <div
      ref={el}
      style="width: 600px;height:400px;"
      onconnected={onMounted}
      ondisconnected={onUnmounted}
    ></div>
  )
}


export interface PlotHandlerProps {
  store: StoreInterface
}

export function PlotHandler(props: PlotHandlerProps) {

  const { store } = props

  /*
  const dataFetchOptions = {
    sortKind: 0,
  } as DataFetchOptions
  */

  const [state, setState] = createState({
    columns: [] as string[],
    plotData: {} as any,
    selectedColX: undefined! as number,
    selectedColY: undefined! as number,
  })

  createEffect(() => {
    // handels updates of selected column indices
    let xCol = state.selectedColX;
    let yCol = state.selectedColY;
    if (xCol != undefined && yCol != undefined) {
      fetchData(xCol, yCol);
    }
  })

  async function fetchColumns() {
    let columns = await store.fetchColumns()
    console.log(columns)
    setState({columns: columns})

    if (columns.length >= 2) {
      setState({
        selectedColX: 0,
        selectedColY: 1,
      })
    }
  }

  async function fetchData(xCol: number, yCol: number) {
    console.log(`Fetching data for columns ${xCol} vs ${yCol}`)
    let data = await store.fetchData({
      sortKind: 0
    })
    console.log(data)

    const numCols = data.length;
    if (numCols === 0) {
      console.log("WARNING: received data with 0 columns, ignoring...");
      return;
    }
    console.log(numCols)
    const numRows = data[0].values.length;

    let rowsData = Array(numRows);
    for (let i=0; i<numRows; i++) {
      let rowData = Array(2);
      rowData[0] = data[xCol].values[i].toString();
      rowData[1] = data[yCol].values[i].toString();
      rowsData[i] = rowData;
    }

    // specify chart configuration item and data
    let plotData = {
      xAxis: {},
      yAxis: {},
      series: [{
        symbolSize: 5,
        data:rowsData,
        type: 'scatter'
      }]
    };
    setState({plotData: plotData} as any) // FIXME: why cast needed?
  }

  fetchColumns()

  return (
    <div>
      <div class="form-row">
        <span class="form-label">Dimension x</span>
        <Dropdown
          items={(state.columns)}
          selectedIndex={(state.selectedColX)}
          cbSelect={(index: number) => setState({selectedColX: index})}
        />
      </div>
      <div class="form-row">
        <span class="form-label">Dimension y</span>
        <Dropdown
          items={(state.columns)}
          selectedIndex={(state.selectedColY)}
          cbSelect={(index: number) => setState({selectedColY: index})}
        />
      </div>
      <PlotWrapper plotData={(state.plotData)}/>
    </div>
  )
}
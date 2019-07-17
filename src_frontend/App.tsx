
import { StoreInterface } from "./store";

import { Tabs } from "./Tabs";
import { TableHandler } from "./TableHandler"
import { PlotHandler } from "./PlotHandler"

import { IconDatabase, IconChartBar } from "./Icons"

export function App({store} : {store: StoreInterface}) {

  let tabContents = [
    {
      name: <span><IconDatabase/> Table </span>,
      component: <TableHandler store={store}/>,
    },
    {
      name: <span><IconChartBar/> Plot </span>,
      component: <PlotHandler store={store}/>,
    }
  ]

  return (
    <div class="container">
      <Tabs contents={tabContents}/>
    </div>
  )
}

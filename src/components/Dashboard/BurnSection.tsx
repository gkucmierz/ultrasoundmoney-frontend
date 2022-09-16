import dynamic from "next/dynamic";
import type { FC } from "react";
import { Suspense, useCallback, useState } from "react";
import type { GroupedAnalysis1 } from "../../api/grouped-analysis-1";
import type { Unit } from "../../denomination";
import type { TimeFrameNext } from "../../time-frames";
import { timeFramesNext } from "../../time-frames";
import BasicErrorBoundary from "../BasicErrorBoundary";
import BurnCategoryWidget from "../BurnCategoryWidget";
import BurnTotal from "../BurnTotal";
import CurrencyControl from "../CurrencyControl";
import SectionDivider from "../SectionDivider";
import TimeFrameControl from "../TimeFrameControl";
import ToggleSwitch from "../ToggleSwitch";
import { WidgetTitle } from "../WidgetSubcomponents";

const BurnLeaderboard = dynamic(() => import("../BurnLeaderboard"), {
  ssr: false,
});
const LatestBlocks = dynamic(() => import("../LatestBlocks"), { ssr: false });
const BurnRecords = dynamic(() => import("../BurnRecords"), { ssr: false });
const DeflationaryStreak = dynamic(() => import("../DeflationaryStreak"), {
  ssr: false,
});

type Props = {
  groupedAnalysis1: GroupedAnalysis1;
};

const BurnSection: FC<Props> = ({ groupedAnalysis1 }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrameNext>("d1");
  const [unit, setUnit] = useState<Unit>("eth");

  const handleSetTimeFrame = useCallback(setTimeFrame, [setTimeFrame]);

  const onSetUnit = useCallback(setUnit, [setUnit]);

  const handleClickTimeFrame = useCallback(() => {
    const currentTimeFrameIndex = timeFramesNext.indexOf(timeFrame);
    const nextIndex =
      currentTimeFrameIndex === timeFramesNext.length - 1
        ? 0
        : currentTimeFrameIndex + 1;

    setTimeFrame(timeFramesNext[nextIndex]);
  }, [timeFrame]);

  return (
    <div id="burn">
      <SectionDivider
        link="burn"
        subtitle="it's getting hot in here"
        title="the burn"
      />
      <BasicErrorBoundary>
        <Suspense>
          <div className="flex flex-col gap-4 xs:px-4 md:px-16 ">
            <div className={`bg-blue-tangaroa rounded-lg p-8`}>
              <div className="grid grid-cols-2 md:flex md:justify-between flex-col gap-y-8 md:flex-row lg:gap-y-0 ">
                <div className="row-start-1 flex flex-col gap-4 lg:gap-x-4 lg:flex-row lg:items-center">
                  <WidgetTitle>time frame</WidgetTitle>
                  <TimeFrameControl
                    selectedTimeframe={timeFrame}
                    onSetTimeFrame={handleSetTimeFrame}
                  />
                </div>
                <div className="row-start-2 md:row-start-1 flex flex-col gap-y-4 lg:gap-x-4 lg:flex-row lg:items-center">
                  <WidgetTitle>currency</WidgetTitle>
                  <CurrencyControl selectedUnit={unit} onSetUnit={onSetUnit} />
                </div>
              </div>
            </div>
            <div
              className={`
                grid grid-cols-1 lg:grid-cols-2
                gap-y-4 md:gap-x-4
              `}
            >
              <BurnTotal
                groupedAnalysis1={groupedAnalysis1}
                onClickTimeFrame={handleClickTimeFrame}
                timeFrame={timeFrame}
                unit={unit}
              />
              <div className="lg:col-start-2 lg:row-start-1 lg:row-end-5 lg:h-[688px] xl:h-[702px] flex flex-col gap-y-4">
                <BurnLeaderboard
                  groupedAnalysis1={groupedAnalysis1}
                  onClickTimeFrame={handleClickTimeFrame}
                  timeFrame={timeFrame}
                  unit={unit}
                />
                <BurnCategoryWidget
                  onClickTimeFrame={handleClickTimeFrame}
                  timeFrame={timeFrame}
                />
              </div>
              <div className="lg:row-start-2">
                <LatestBlocks groupedAnalysis1={groupedAnalysis1} unit={unit} />
              </div>
              <div className="lg:row-start-3">
                <DeflationaryStreak groupedAnalysis1={groupedAnalysis1} />
              </div>
              <div className="lg:row-end-5">
                <BurnRecords
                  groupedAnalysis1={groupedAnalysis1}
                  onClickTimeFrame={handleClickTimeFrame}
                  timeFrame={timeFrame}
                />
              </div>
            </div>
          </div>
        </Suspense>
      </BasicErrorBoundary>
    </div>
  );
};

export default BurnSection;

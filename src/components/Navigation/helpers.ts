import { StepperPoint } from "../../context/StepperContext";

export const getIconOffset = (
  pointsHeights: (StepperPoint | undefined)[],
  pageLoad: boolean
) => {
  if (!pageLoad) return 0;
  const trackPosition = window.scrollY + window.innerHeight / 2;
  if (pointsHeights) {
    const pointsQuantity = pointsHeights.length;
    const lastPoint = pointsHeights[pointsQuantity - 1];
    const distanceBetweenPoints = 100 / (pointsHeights.length - 1);
    let globalPercent = 0;

    if (lastPoint && trackPosition > lastPoint?.offsetY) return 100;
    for (let index = 0; index < pointsHeights.length; index++) {
      const nextPoint = pointsHeights[index + 1]?.offsetY;
      const currentPoint = pointsHeights[index]?.offsetY;
      if (
        currentPoint &&
        nextPoint &&
        trackPosition > currentPoint &&
        trackPosition < nextPoint
      ) {
        const from = trackPosition - currentPoint;
        const to = nextPoint - currentPoint;
        const percent = (from / to) * 100;
        globalPercent =
          distanceBetweenPoints * index +
          (percent * distanceBetweenPoints) / 100;
      }
    }
    return globalPercent;
  }
  return 0;
};

export const setScrollPosition = (
  controllPoints: StepperPoint[],
  trackWidth: number,
  iconOffset: number,
  stepsRefElem: HTMLElement
): boolean => {
  const distancesNumber = controllPoints.length - 1;
  const distanceWidth = trackWidth / distancesNumber;
  const distanceOrderItem = Math.ceil(iconOffset / distanceWidth);
  const parentBlock = stepsRefElem.parentElement!;
  const trackingChildrenBlock = Array.from(parentBlock.children).find(
    (elem: any) => elem.dataset.navigationtrackingblock
  );
  if (trackingChildrenBlock) {
    const allTrackingChildren = Array.from(trackingChildrenBlock.children);
    const blocksHeights = allTrackingChildren.map((elem) => {
      const blockHeight = elem.getBoundingClientRect().height;
      return blockHeight;
    });
    let iconOffsetInBlock;
    if (distanceOrderItem > 1) {
      iconOffsetInBlock = iconOffset - distanceWidth * (distanceOrderItem - 1);
    } else {
      iconOffsetInBlock = iconOffset;
    }
    const percentOffsetBlock = iconOffsetInBlock / distanceWidth;
    const certainBlockHeight = blocksHeights[distanceOrderItem - 1];
    const blockYOffset = certainBlockHeight * percentOffsetBlock;
    const drawingLineHight = allTrackingChildren[0].children[0].getBoundingClientRect()
      .height;
    const offsetValue =
      controllPoints[distanceOrderItem - 1]?.offsetY +
      blockYOffset -
      drawingLineHight;

    window.scrollTo({ top: offsetValue });
    const isActiveDot =
      iconOffsetInBlock > (distanceWidth / 4) * 3 &&
      distanceOrderItem === distancesNumber;
    return isActiveDot;
  } else return false;
};

export const showHideNavBar = (
  controlPoints: (StepperPoint | undefined)[],
  stepsRefElem: HTMLElement
) => {
  let offsetYFirstPoint = 2;
  controlPoints.forEach((el, index) => {
    if (index === 0 && typeof el?.offsetY === "number") {
      offsetYFirstPoint = el?.offsetY;
    }
  });
  const maxOffsetYValue = controlPoints.reduce(
    (acc: number, item: StepperPoint | undefined) =>
      item && acc < item.offsetY ? item.offsetY : acc,
    0
  );
  const collectionElems = stepsRefElem.parentElement?.children!;
  const childrenElems = Array.from(collectionElems);
  const lastSectionIndex: number = childrenElems.findIndex(
    (node) => node.id === "next-merge"
  )!;
  const lastSectionHight = childrenElems[
    lastSectionIndex
  ]?.getBoundingClientRect()?.height;
  const nextDrawingLineHight = childrenElems[
    lastSectionIndex + 1
  ]?.getBoundingClientRect()?.height;
  if (lastSectionHight && maxOffsetYValue && nextDrawingLineHight) {
    const showStickyHeader: boolean =
      window.scrollY > offsetYFirstPoint - window.innerHeight / 2 &&
      window.scrollY <
        maxOffsetYValue + lastSectionHight + nextDrawingLineHight;
    showStickyHeader
      ? stepsRefElem.classList.add("active")
      : stepsRefElem.classList.remove("active");
  }
};

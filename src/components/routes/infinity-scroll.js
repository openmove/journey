import React, { Component } from "react";

class InfinityScroll extends Component {
  constructor(props) {
    super(props);
    // this.state.activeList = [];
    // this.completeList = [];
    this.state = {
      lastItemIndex: 0,
    };
    this.componentRef = React.createRef();
    this.timer;

    this.handleInfiniteScroll = this.handleInfiniteScroll.bind(this);
    this.isOverflown = this.isOverflown.bind(this);
  }

  // previous code worked by memorizing an active list and a complete list
  // this was discarded because it didn't update if the list passed as prop changed

  /* chunkArrayInGroups(arr, size) {
    // https://stackoverflow.com/questions/40682103/splitting-an-array-up-into-chunks-of-a-given-size
    var myArray = [];
    for (var i = 0; i < arr.length; i += size) {
      myArray.push(arr.slice(i, i + size));
    }
    return myArray;
  } */

  /* handleInfiniteScroll() {
    console.log("scroll ");
    const activeMode = this.state.activeTab;
    const el = this.tabs[activeMode].ref;
    const endOfPage = this.checkScroll(el);
    console.log(endOfPage);
    if (endOfPage) {
      const mode = this.state.activeTab;
      this.addSubsectionToArray(
        this.tabs[mode].routes,
        this.tabs[mode].activeRoutes,
        10,
        (route) => this.generateRouteRow(route)
      );
    }
  } */

  /* copySubsection(arr, i, nOfElements) {
    const myArray = [];
    myArray.push(...arr.slice(i, i + nOfElements));
    return myArray;
  }*/

  /* addSubsectionToArray(arr, newArray, nOfElements, postProcess) {
    let tempCopy = this.copySubsection(arr, newArray.length, nOfElements);
    tempCopy = tempCopy.map(postProcess);
    return newArray.concat(tempCopy);
  } */

  /*  increaseList(){
    this.setState((prevState)=>({
      activeList:this.addSubsectionToArray(
        this.prevState.completeList,
        this.prevState.activeList,
        this.props.increaseStep,
        this.props.postProcess,
      );
    }))
  } */

  computeIncreasedStep(previousIndex) {
    if (
      this.props.completeList &&
      previousIndex + this.props.increaseStep >=
        this.props.completeList.length &&
      previousIndex < this.props.completeList.length - 1
    ) {
      return this.props.completeList.length - 1;
    }
    return previousIndex + this.props.increaseStep;
  }

  handleInfiniteScroll() {
    const callback = () => {
      const endOfPage = this.checkScroll(
        this.componentRef.current,
        this.props.offset
      );

      if (!endOfPage) return;

      this.setState((prevState) => ({
        lastItemIndex: this.computeIncreasedStep(prevState.lastItemIndex),
      }));
    };

    // throttle
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(callback, 50);
  }

  isOverflown(element) {
    return element.scrollHeight > element.clientHeight;
  }

  checkScroll(element, offset = 30) {
    const isScrolledToBottom = (element) => {
      return (
        element.scrollHeight - Math.round(element.scrollTop) - offset <=
        element.clientHeight
      );
    };
    return isScrolledToBottom(element);
  }

  componentDidMount() {
    this.componentRef.current.addEventListener(
      "scroll",
      this.handleInfiniteScroll
    );
  }

  componentWillUnmount() {
    this.componentRef.current.removeEventListener(
      "scroll",
      this.handleInfiniteScroll
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.props.completeList) {
      return;
    }

    // compute initial index
    const initialIndex = this.computeIncreasedStep(0);
    if (prevState.lastItemIndex < initialIndex) {
      this.setState({ lastItemIndex: initialIndex });
    }

    // fill the list until it causes overflow
    if (
      !this.isOverflown(this.componentRef.current) &&
      this.state.lastItemIndex < this.props.completeList.length &&
      this.componentRef.current.parentElement.classList.contains("active")
      // if parent element in tabs it is not active then children can not cause overflow
    ) {
      this.setState((prevState) => ({
        lastItemIndex: this.computeIncreasedStep(prevState.lastItemIndex),
      }));
    }
  }

  render() {
    let activeComponents = [];
    for (let i = 0; i < this.state.lastItemIndex; i++) {
      if (this.props.completeList[i]) {
        activeComponents.push(this.props.completeList[i]);
      }
    }

    activeComponents = activeComponents.map(this.props.postProcess);

    return (
      <div
        className={this.props.className || "infiniteScrollContainer"}
        ref={this.componentRef}
        style={{ height: this.props.height || "100%", overflowY: "auto" }}
      >
        {activeComponents}
      </div>
    );
  }
}

export default InfinityScroll;

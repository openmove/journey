import React, { Component } from "react";
import { Form, FormControl, Button } from "react-bootstrap";

class Search extends Component {
  constructor(props) {
    super(props);
    this.state = { query: "" };
    this.timer;

    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount(){
    // initialize list
    this.props.setFilteredList(this.props.completeList);
  }

  componentDidUpdate(prevProps) {
    // initialize list if was previously empty
    if (
      prevProps.completeList?.length <=1 &&
      this.props.completeList?.length >1
    ) {
      const filteredList = this.filter(
        this.props.completeList,
        this.state.query
      );
      this.props.setFilteredList(filteredList);
    }
  }

  filter(list, query) {
    const isQueryEmpty = query === "";
    if (isQueryEmpty) return list;

    return list.filter((el) => {
      for (const [key, value] of Object.entries(el)) {

        const isQueryContained =
          // key?.toLowerCase()?.includes(query) ||
          value?.toString()?.toLowerCase()?.includes(query?.toLowerCase());

        if (isQueryContained) {
          return true;
        }
      }
      return false;
    });
  }

  handleChange(e) {
    const updatedQuery = e.target.value;
    this.setState({ query: updatedQuery });

    const callback = () => {
      const filteredList = this.filter(
        this.props.completeList,
        this.state.query
      );
      this.props.setFilteredList(filteredList);
    };

    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(callback, 200);
  }

  render() {
    return (
      <Form className="d-flex">
        <FormControl
          type="search"
          value={this.state.query}
          placeholder="Search"
          className="search"
          aria-label="Search"
          onChange={this.handleChange}
        />
      </Form>
    );
  }
}

export default Search;

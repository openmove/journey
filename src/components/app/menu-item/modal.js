import React, { Component } from "react";
import { withNamespaces } from "react-i18next";
import { withRouter } from "react-router";
import { Modal as BModal, Button } from "react-bootstrap";

class Modal extends Component {
  constructor(props) {
    super(props);
    this.url = `/${this.props.name || "modal"}`;

    this.state = { isVisible: this.isUrlMatching(), modalContent: "" };

    this.onClick = this.onClick.bind(this);
    this.onHide = this.onHide.bind(this);
  }

  isUrlMatching() {
    return this.props.location.pathname === this.url;
  }

  onClick() {
    if (!this.isUrlMatching()) {
      this.props.history.push(this.url);
    }
    this.setState({ isVisible: true });
  }

  onHide() {
    this.props.history.goBack();
    // this.setState({ isVisible: false }); // probably is not needed, kept for safety
  }

  async fetchPage(pageUrl) {

    return fetch(pageUrl)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error("Network Error");
      })
      .catch((error) => {
        const text = this.props.t('error_network');
        return `<p class="modal-error">${text}<p>`;
      });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.isUrlMatching()) {
      if (!prevState.isVisible) {
        this.setState({ isVisible: true });
      }
    } else {
      if (prevState.isVisible) {
        this.setState({ isVisible: false });
      }
    }
  }

  componentDidMount() {
    const { title = "", text, htmlUrl, t, menuItem } = this.props;
    if (htmlUrl) {
      //
      //TODO prepend config.staticBaseUrl if != from journey domain
      //
      this.fetchPage(htmlUrl).then((html) => {
        const translations = {
          credits_title_developed: t("credits_title_developed"),
          credits_title_designed: t("credits_title_designed"),
          credits_title_data_provided: t("credits_title_data_provided"),
          credits_outdooractive_attribution: t("credits_outdooractive_attribution"),
        };

        const htmlTranslated = t(html, {
          ...translations,
          nsSeparator: false,
        });
        const content = (
          <div dangerouslySetInnerHTML={{ __html: htmlTranslated }}></div>
        );
        this.setState({ modalContent: content });
      });
    } else {
      const content = <p>{text}</p>;
      this.setState({ modalContent: content });
    }
  }

  render() {
    const { title = "", text = "", htmlUrl, MenuItem, t } = this.props;

    return (
      <>
        <MenuItem onClick={this.onClick} />

        <BModal
          className="credits-modal"
          bsSize="large"
          show={this.state.isVisible}
          onHide={this.onHide}
        >
          <BModal.Header closeButton>
            <BModal.Title>{t(title)}</BModal.Title>
          </BModal.Header>
          <BModal.Body>{this.state.modalContent}</BModal.Body>
          <BModal.Footer>
            <Button variant="secondary" onClick={this.onHide}>
              {t("close")}
            </Button>
          </BModal.Footer>
        </BModal>
      </>
    );
  }
}

export default withRouter(withNamespaces()(Modal));

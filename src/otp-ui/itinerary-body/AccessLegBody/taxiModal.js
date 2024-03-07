import React from "react";
import { Modal, Button, Row, Col } from "react-bootstrap";
import { Taxi } from "../../icons/openmove";
import FontAwesome from "react-fontawesome";
import { isMobile } from "../../core-utils/ui";
import Icon from "../../../components/narrative/icon";
import { withNamespaces } from "react-i18next";

const MobileModal = (props) => {
  const { shown, open, close, t } = props;

  return (
    <Modal show={shown} onHide={close} className="taxi-modal-mobile">
      <Modal.Header closeButton onHide={close}>
        <Modal.Title>{t("available_taxies")}</Modal.Title>
      </Modal.Header>
      {props.children}
      <div className="footer">
        <Button bsStyle="link" onClick={close} className="close-btn">
          {t("close")}
        </Button>
      </div>
    </Modal>
  );
};

const Loading = () => (
  <div className="loading">
    <FontAwesome name="circle-o-notch" spin={true} size="3x" />
  </div>
);

const Error = (props) => {
  const { t } = props;

  return (
    <div className="error">
      <p>{t("error_network")}</p>
      <Button onClick={() => props.setError(false)}>
        <span>
          <i className={`fa fa-undo`} />{" "}
        </span>
        {t("reload")}
      </Button>
    </div>
  );
};

const TaxiContainer = ({ taxi, t }) => {
  const { name, email, phone } = taxi;

  return (
    <div className="taxi-container">
      <div className="taxi-container-header">
        <Taxi width={"25px"} height={"25px"} />
        <h5 className="taxi-container-title">{name}</h5>
      </div>
      <div className="taxi-container-buttons">
        {email && (
          <Button href={"mailto:" + email} bsStyle="primary" target="_blank">
            {t("email")} <FontAwesome name="envelope" tag="i" />{" "}
          </Button>
        )}
        {phone && (
          <Button href={"tel:" + phone} bsStyle="primary">
            {t("phone")} <FontAwesome name="phone" tag="i" />{" "}
          </Button>
        )}
      </div>
    </div>
  );
};

const DesktopModal = (props) => {
  const { shown, open, close, t } = props;

  if (!props.shown) {
    return null;
  }
  return (
    <div className="taxi-modal-desktop">
      <div className="header">
        <div className="back-button-container">
          <Button bsSize="small" onClick={close}>
            <Icon type="arrow-left" />
            {t("back")}
          </Button>
        </div>
        <div className="title">{t("available_taxies")}</div>
      </div>
      {props.children}
    </div>
  );
};

const ModalContent = (props) => {
  const { taxies, t } = props;

  return (
    <Modal.Body className="body">
      <div className="taxi-list">
        {taxies.map((taxi) => (
          <TaxiContainer taxi={taxi} t={t} key={taxi?.id} />
        ))}
      </div>
    </Modal.Body>
  );
};
class TaxiModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { taxies: [], error: false, loading: false };
    this.setError = this.setError.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      (prevProps.shown === false && this.props.shown === true) ||
      (prevState.error === true && this.state.error == false)
    ) {
      this.fetchTaxies(this.props.api);
    }
  }

  componentDidMount() {}
  render() {
    const { shown, open, close, t } = this.props;
    const { taxies, loading, error } = this.state;

    if (isMobile()) {
      return (
        <MobileModal {...this.props}>
          {loading && <Loading />}
          {error && <Error setError={this.setError} t={t} />}
          {taxies && taxies?.length > 0 && (
            <ModalContent {...this.props} taxies={taxies} />
          )}
        </MobileModal>
      );
    } else {
      return (
        <DesktopModal {...this.props}>
          {loading && <Loading />}
          {error && <Error t={t} setError={this.setError} />}
          {taxies && taxies?.length > 0 && (
            <ModalContent {...this.props} taxies={taxies} />
          )}
        </DesktopModal>
      );
    }
  }
  open() {
    setState({ open: true });
  }

  close() {
    setState({ open: false });
  }

  setLoading(isLoading) {
    this.setState({ loading: isLoading });
  }

  setError(isError) {
    this.setState({ error: isError });
  }

  async fetchTaxies(url) {

    const headers = {
      headers: {
        Accept: "application/json",
      },
    };

    this.setLoading(true);

    fetch(url, headers)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Network Error");
      })
      .then((taxies) => {
        this.setLoading(false);
        console.log(taxies);
        this.setState({ taxies });
      })
      .catch((error) => {
        this.setLoading(false);
        this.setError(true);
      });
  }
}

export default withNamespaces()(TaxiModal);

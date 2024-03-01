import React from "react";
import { Modal, Button, Row, Col } from "react-bootstrap";
import { Car } from "../../icons/openmove";
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
  return (
    <>
      <Modal.Body className="body">
        <div className="taxi-list">
          <div className="taxi-container">
            <div className="taxi-container-header">
              <Car width={"25px"} height={"25px"} />
              <h5 className="taxi-container-title">taxi velocissimo</h5>
            </div>
            <div className="taxi-container-buttons">
              <Button
                href="mailto:pino.pall@mail.com"
                bsStyle="primary"
                target="_blank"
              >
                Email <FontAwesome name="envelope" tag="i" />{" "}
              </Button>
              <Button href="tel:+1234567890" bsStyle="primary">
                Telefono <FontAwesome name="phone" tag="i" />{" "}
              </Button>
            </div>
          </div>
          <div className="taxi-container">
            <div className="taxi-container-header">
              <Car width={"25px"} height={"25px"} />
              <h5 className="taxi-container-title">taxi velocissimo</h5>
            </div>
            <div className="taxi-container-buttons">
              <Button
                href="mailto:pino.pall@mail.com"
                bsStyle="primary"
                target="_blank"
              >
                Email <FontAwesome name="envelope" tag="i" style={{marginLeft:"10px"}}/>{" "}
              </Button>
              <Button href="tel:+1234567890" bsStyle="primary">
                Telefono <FontAwesome name="phone" tag="i" />{" "}
              </Button>
            </div>
          </div>
          <div className="taxi-container">
            <div className="taxi-container-header">
              <Car width={"25px"} height={"25px"} />
              <h5 className="taxi-container-title">taxi velocissimo</h5>
            </div>
            <div className="taxi-container-buttons">
              <Button
                href="mailto:pino.pall@mail.com"
                bsStyle="primary"
                target="_blank"
              >
                Email <FontAwesome name="envelope" tag="i" />{" "}
              </Button>
              <Button href="tel:+1234567890" bsStyle="primary">
                Telefono <FontAwesome name="phone" tag="i" />{" "}
              </Button>
            </div>
          </div>
          <div className="taxi-container">
            <div className="taxi-container-header">
              <Car width={"25px"} height={"25px"} />
              <h5 className="taxi-container-title">taxi velocissimo</h5>
            </div>
            <div className="taxi-container-buttons">
              <Button
                href="mailto:pino.pall@mail.com"
                bsStyle="primary"
                target="_blank"
              >
                Email <FontAwesome name="envelope" tag="i" />{" "}
              </Button>
              <Button href="tel:+1234567890" bsStyle="primary">
                Telefono <FontAwesome name="phone" tag="i" />{" "}
              </Button>
            </div>
          </div>
          <div className="taxi-container">
            <div className="taxi-container-header">
              <Car width={"25px"} height={"25px"} />
              <h5 className="taxi-container-title">taxi velocissimo</h5>
            </div>
            <div className="taxi-container-buttons">
              <Button
                href="mailto:pino.pall@mail.com"
                bsStyle="primary"
                target="_blank"
              >
                Email <FontAwesome name="envelope" tag="i" className="icon" />{" "}
              </Button>
              <Button href="tel:+1234567890" bsStyle="primary">
                Telefono <FontAwesome name="phone" tag="i" className="icon"  />{" "}
              </Button>
            </div>
          </div>
          <div className="taxi-container">
            <div className="taxi-container-header">
              <Car width={"25px"} height={"25px"} />
              <h5 className="taxi-container-title">taxi velocissimo</h5>
            </div>
            <div className="taxi-container-buttons">
              <Button
                href="mailto:pino.pall@mail.com"
                bsStyle="primary"
                target="_blank"
              >
                Email <FontAwesome name="envelope" tag="i" />{" "}
              </Button>
              <Button href="tel:+1234567890" bsStyle="primary">
                Telefono <FontAwesome name="phone" tag="i" />{" "}
              </Button>
            </div>
          </div>
          <div className="taxi-container">
            <div className="taxi-container-header">
              <Car width={"25px"} height={"25px"} />
              <h5 className="taxi-container-title">taxi velocissimo</h5>
            </div>
            <div className="taxi-container-buttons">
              <Button
                href="mailto:pino.pall@mail.com"
                bsStyle="primary"
                target="_blank"
              >
                Email <FontAwesome name="envelope" tag="i" />{" "}
              </Button>
              <Button href="tel:+1234567890" bsStyle="primary">
                Telefono <FontAwesome name="phone" tag="i" />{" "}
              </Button>
            </div>
          </div>
          <div className="taxi-container">
            <div className="taxi-container-header">
              <Car width={"25px"} height={"25px"} />
              <h5 className="taxi-container-title">taxi velocissimo</h5>
            </div>
            <div className="taxi-container-buttons">
              <Button
                href="mailto:pino.pall@mail.com"
                bsStyle="primary"
                target="_blank"
              >
                Email <FontAwesome name="envelope" tag="i" />{" "}
              </Button>
              <Button href="tel:+1234567890" bsStyle="primary">
                Telefono <FontAwesome name="phone" tag="i" />{" "}
              </Button>
            </div>
          </div>
          <div className="taxi-container">
            <div className="taxi-container-header">
              <Car width={"25px"} height={"25px"} />
              <h5 className="taxi-container-title">taxi velocissimo</h5>
            </div>
            <div className="taxi-container-buttons">
              <Button
                href="mailto:pino.pall@mail.com"
                bsStyle="primary"
                target="_blank"
              >
                Email <FontAwesome name="envelope" tag="i" />{" "}
              </Button>
              <Button href="tel:+1234567890" bsStyle="primary">
                Telefono <FontAwesome name="phone" tag="i" />{" "}
              </Button>
            </div>
          </div>
          <div className="taxi-container">
            <div className="taxi-container-header">
              <Car width={"25px"} height={"25px"} />
              <h5 className="taxi-container-title">taxi velocissimo</h5>
            </div>
            <div className="taxi-container-buttons">
              <Button
                href="mailto:pino.pall@mail.com"
                bsStyle="primary"
                target="_blank"
              >
                Email <FontAwesome name="envelope" tag="i" />{" "}
              </Button>
              <Button href="tel:+1234567890" bsStyle="primary">
                Telefono <FontAwesome name="phone" tag="i" />{" "}
              </Button>
            </div>
          </div>
          <div className="taxi-container">
            <div className="taxi-container-header">
              <Car width={"25px"} height={"25px"} />
              <h5 className="taxi-container-title">taxi velocissimo</h5>
            </div>
            <div className="taxi-container-buttons">
              <Button
                href="mailto:pino.pall@mail.com"
                bsStyle="primary"
                target="_blank"
              >
                Email <FontAwesome name="envelope" tag="i" />{" "}
              </Button>
              <Button href="tel:+1234567890" bsStyle="primary">
                Telefono <FontAwesome name="phone" tag="i" />{" "}
              </Button>
            </div>
          </div>
          <div className="taxi-container">
            <div className="taxi-container-header">
              <Car width={"25px"} height={"25px"} />
              <h5 className="taxi-container-title">taxi velocissimo</h5>
            </div>
            <div className="taxi-container-buttons">
              <Button
                href="mailto:pino.pall@mail.com"
                bsStyle="primary"
                target="_blank"
              >
                Email <FontAwesome name="envelope" tag="i" />{" "}
              </Button>
              <Button href="tel:+1234567890" bsStyle="primary">
                Telefono <FontAwesome name="phone" tag="i" />{" "}
              </Button>
            </div>
          </div>
          <div className="taxi-container">
            <div className="taxi-container-header">
              <Car width={"25px"} height={"25px"} />
              <h5 className="taxi-container-title">taxi velocissimo</h5>
            </div>
            <div className="taxi-container-buttons">
              <Button
                href="mailto:pino.pall@mail.com"
                bsStyle="primary"
                target="_blank"
              >
                Email <FontAwesome name="envelope" tag="i" />{" "}
              </Button>
              <Button href="tel:+1234567890" bsStyle="primary">
                Telefono <FontAwesome name="phone" tag="i" />{" "}
              </Button>
            </div>
          </div>
        </div>
      </Modal.Body>
    </>
  );
};
class TaxiModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, taxes: [] };
  }

  componentDidMount() {}
  render() {
    const { shown, open, close } = this.props;

    if (isMobile()) {
      return (
        <MobileModal {...this.props}>
          <ModalContent {...this.props} />
        </MobileModal>
      );
    } else {
      return (
        <DesktopModal {...this.props}>
          <ModalContent {...this.props} />
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

  async fetchPage(pageUrl) {
    return fetch(pageUrl)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error("Network Error");
      })
      .catch((error) => {
        const text = this.props.t("error_network");
        return `<p class="modal-error">${text}<p>`;
      });
  }
}

export default withNamespaces()(TaxiModal);

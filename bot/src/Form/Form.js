import React, { Component } from "react";
import axios from "axios";
import CSS from "./Form.module.css";

export default class Form extends Component {
  state = {
    userid: "",
    text: "",
    selectedFile: null,
    responseServer: null,
    responseError: null,
  };
  handleChange = ({ target }) => {
    const { name, value } = target;
    this.setState({ [name]: value });
  };
  onChangeHandler = (event) => {
    this.setState({
      selectedFile: event.target.files[0],
    });
  };
  handleSubmit = (e) => {
    const { userid, text } = this.state;
    e.preventDefault();
    const data = new FormData();
    data.append("file", this.state.selectedFile);
    data.append("userid", userid);

    axios({
      method: "post",
      url: "/sendmessage",
      data,
      headers: {
        accept: "application/json",
        "Content-Type": `multipart/form-data;`,
      },
    })
      .then((response) => {
        console.log(response);
        this.setState({ responseServer: response.data });
        this.setState({ userid: "", text: "" });
      })
      .catch((error) => {
        if (error)
          this.setState({
            responseError: "Что-то пошло не так, увы письмо не отправилось :(",
          });
      });
  };

  render() {
    const { userid, text, responseServer, responseError } = this.state;
    return (
      <>
        <div className={CSS.revervePlaceText}>
          <button className={CSS.closeModalButton} onClick={this.props.onClose}>
            X
          </button>

          {responseError && <p>{responseError}</p>}
        </div>

        {responseServer ? (
          <p className={CSS.successMail}>{responseServer}</p>
        ) : (
          <form onSubmit={this.handleSubmit} className={CSS.from}>
            <input
              className={CSS.formGroup}
              type="text"
              name="userid"
              value={userid}
              placeholder="user ID"
              // required
              onChange={this.handleChange}
            />
            <textarea
              className={`${CSS.formGroup} ${CSS.textarea}`}
              name="text"
              value={text}
              placeholder="Message..."
              // required
              onChange={this.handleChange}
            ></textarea>
            <input
              className={CSS.formGroup}
              type="file"
              name="file"
              onChange={this.onChangeHandler}
            />

            <button className={`${CSS.formGroup} ${CSS.button}`} type="submit">
              Send message
            </button>
          </form>
        )}
      </>
    );
  }
}

import React from "react";
import { useNavigate } from "react-router-dom";
import logo_img from "../styles/images/logo-img.png";
import { FaHandshake } from "react-icons/fa";

const Greeting = () => {
  const navigate = useNavigate();
  return (
    <div className="container">
      <div className="signup-container">
        <div className="signup-header">
          <img
            src={logo_img}
            alt="logo"
            className="signup-header__logo"
            onClick={() => navigate("/")}
          />
        </div>
        <div
          className="greeting-container"
          style={{
            width: "80%",
            height: "80vh",
            display: "flex",
            flexDirection: "column",
            // justifyContent:"center"
          }}
        >
          <div className="text" style={{ "margin-top": "50px" }}>
            {/* //? Heading */}
            <p style={{ marginBottom: "10px", fontSize: "2.3rem" }}>
              Congratulations!!
            </p>{" "}
            <br />
            {/* //? Congratulations pic */}
            <p style={{ marginBottom: "10px", fontSize: "1.4rem" }}>
              "Thank you for successfully taking the first step towards growing
              your online business. Sit back and relax, while we crunch data for
              you and competition. We expect to have everything ready max by
              next 3 days. Keep exploring and we will reach out with much more
              soon!"
            </p>{" "}
            <br />
          </div>
          <button >Let me Explore!!</button>
          <button>Reach out to us!</button>
        </div>
      </div>
    </div>
  );
};

export default Greeting;
import React from "react";
import NegativeReviewCard from "../../components/customerReviews/NegativeReviewCard";
import InfoCard from "../../components/InfoCard";
import { AiFillStar } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
const resultType = "month";

const CustomerReviews = () => {
  const { data, currentProductIndex } = useSelector((state) => state.data);
  const navigate = useNavigate();

  const customerReviews = data[currentProductIndex]["customerReviews"];
  const {
    negative,
    OrdersPerRating,
    monthlyResult,
    weeklyResult,
    totalRatings,
  } = customerReviews;

  const ratings = Object.keys(OrdersPerRating).map((key) => {
    let rating = key.split("_")[0];
    let obj = {};
    obj[rating] = OrdersPerRating[key];
    return obj;
  });

  const value = resultType === "month" ? monthlyResult : weeklyResult;

  console.log(ratings, "ratings");
  const colors = [
    "#00C689",
    "#2A327D",
    "#FFCA00",
    "#FFB039",
    "#FFA20F",
    "#FE645A",
  ];

  return (
    <>
      <InfoCard name={"Current Rating"} value={value} type={"rating"} />
      {/* Rating bars */}
      <div className="rating-bar">
        {ratings.map((rating, index) => {
          return (
            <div className="rating-bar__item" key={index}>
              <div className="rating-bar__item--rating">
                <span className="rating">{Object.keys(rating)[0]}</span>
                <AiFillStar className="icon" />
              </div>
              <div className="rating-bar__item--bar">
                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.floor(
                      (Object.values(rating)[0] / totalRatings)* 100)}%`,
                    backgroundColor: `${colors[index]}`,
                  }}
                ></div>
              </div>
              <div className="rating-bar__item--orders">
                <span>{Object.values(rating)[0]} Orders</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="negative-reviews">
        {negative.map((item, index) => {
          const { id, name, issues } = item;
          return <NegativeReviewCard key={id} name={name} issues={issues} />;
        })}
      </div>
      <div
        onClick={() => navigate("/allReviews")}
        className="review-btn__btn screen-btn"
      >
        See All Reviews
      </div>
    </>
  );
};

export default CustomerReviews;
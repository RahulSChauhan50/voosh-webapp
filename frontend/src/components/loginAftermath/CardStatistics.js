import React from "react";
import { AiOutlineRise, AiOutlineFall } from "react-icons/ai";

const CardStatistics = ({ cardStatistics }) => {
  const {
    value: currentValue,
    change,
    benchmark,
    changeTypeDirection,
    type,
  } = cardStatistics;

  let value = parseInt(currentValue);
  const diff = value - change;
  console.log(diff, "diff");


  return (
    <>
      <div className="card-statistics__value">
        {/* //?top value */}
        <span className="icon-box">
          {changeTypeDirection === "up" ? (
            <AiOutlineRise className="green rise-fall_icon" size={25} />
          ) : (
            <AiOutlineFall className="red rise-fall_icon" size={25} />
          )}
        </span>
        {type === "money" && (
          <span className={`value ${changeTypeDirection === "up" ?"green":"red"}`}>
            {value.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
              style: "currency",
              currency: "INR",
            })}
          </span>
        )}
        {type === "percentage" && <span className={`value ${changeTypeDirection === "up" ?"green":"red"}`}>{value}%</span>}
      </div>
      {/* //?bottom value */}
      {change !== null ? (
        <div className="card-statistics__info">
          {diff >= 0 ? (
            // ? Positive value
            <span className="change change-green">{diff}% over target</span>
          ) : (
            // ? Negative value
            <span className="change change-red">{ Math.abs(diff)}% below target</span>
          )}{" "}
          
        </div>
      ) : (
        <div className="card-statistics__info">
          {/* //! for not present data */}
          competition comparison<br/> coming soon
        </div>
      )}
    </>
  );
};

export default CardStatistics;
const router = require("express").Router();
const { MongoClient } = require("mongodb");
const { getTimeLog } = require("../utils/dateProvide");
const jwt = require("jsonwebtoken");
const {
  getAllRestaurants,
  getAllSwiggyAndZomatoRestaurants,
} = require("../utils/getAllRestaurants");

// Todo: when Use it, jst change the name!
const {
  checkAuthenticationByGoogle: checkGoogleLogin,
} = require("../controller/googleAuth");
const { checkAuthentication } = require("../controller/checkAuth");

const { getAllSwiggyData } = require("../DataProviders/getAllSwiggyData");
const { getAllZomatoData } = require("../DataProviders/getAllZomatoData");

const VooshDB =
  "mongodb://analyst:gRn8uXH4tZ1wv@35.244.52.196:27017/?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false";

const documentName = "operationsdb";
const secret = "secret";

router.post("/user-save-details", async (req, res) => {
  // ?Main Collection
  // const newCollectionName = "onboard_products";
  // ? Test Collection
  const newCollectionName = "Onboard_New_Users_UAT";

  const { name, phone, email, restaurant_name } = req.body;

  try {
    const client = await MongoClient.connect(VooshDB, {
      useNewUrlParser: true,
    });

    const user = await client
      .db(documentName)
      .collection(newCollectionName)
      .insertOne({
        name,
        phone,
        email,
        restaurant_name,
        form_submit_date: new Date(),
      });

    return res.json({
      status: "success",
      message: `User Basic Details Saved Successfully!`,
    });
  } catch (err) {
    res.json({
      status: "error",
      message: `Error while signup :${err}`,
    });
  }
});

// !Get All Data
router.post("/voosh-data", checkAuthentication, async (req, res) => {
  console.log("---------- <Get All Data Start> ----------------");
  try {
    // TODO get all data from mongodb specified resturant
    // ? res_id & documnetName needed,
    // ?or by default is set as some static value
    const {
      res_id,
      id,
      res_name,
      phone,
      listing_id,
      restaurant_name,
      swiggy_res_id,
      zomato_res_id,
    } = req.payload;
    const date = req.body.date;

    const {
      number,
      resultType,
      startDate,
      endDate,
      zomato_res_id: z_res_id,
      swiggy_res_id: s_res_id,
      listingID,
    } = req.body;

    console.log(
      "Current User:\n",
      "id:",
      id,
      "res_id:",
      res_id,
      "phone:",
      phone,
      "Restaurant Name:",
      res_name,
      "date:",
      date,
      "number:",
      number,
      "resultType:",
      resultType,
      "startDate:",
      startDate,
      "endDate:",
      endDate,
      "zomato_res_id:",
      zomato_res_id,
      "swiggy_res_id:",
      swiggy_res_id,
      "listingID:",
      listingID
    );

    console.log("************************************************");
    console.log(z_res_id, s_res_id, "z_res_id, s_res_id");
    console.log(zomato_res_id, swiggy_res_id, "zomato_res_id, swiggy_res_id");
    console.log("************************************************");

    let newRestaurantList = [];

    const getAllSwiggyAndZomatoRestaurantsData =
      await getAllSwiggyAndZomatoRestaurants(phone);
    newRestaurantList = [...getAllSwiggyAndZomatoRestaurantsData];

    let swiggyData;
    let zomatoData;

    // ?if client is set, then we are selection new restaurant
    // ?if not then it is running for the first time
    if (
      s_res_id !== "" &&
      z_res_id !== "" &&
      zomato_res_id !== z_res_id &&
      swiggy_res_id !== s_res_id
    ) {
      console.log("new call");
      swiggyData = await getAllSwiggyData(
        parseInt(s_res_id),
        number,
        resultType,
        startDate,
        endDate
      );
      zomatoData = await getAllZomatoData(
        parseInt(z_res_id),
        number,
        resultType,
        startDate,
        endDate
      );
    } else {
      console.log("old call");
      swiggyData = await getAllSwiggyData(
        parseInt(swiggy_res_id),
        number,
        resultType,
        startDate,
        endDate
      );
      zomatoData = await getAllZomatoData(
        parseInt(zomato_res_id),
        number,
        resultType,
        startDate,
        endDate
      );
    }

    console.log("---------- <Get All Data Success End> ----------------");
    res.json({
      data: {
        res_name: restaurant_name,
        newRestaurantList: newRestaurantList,
        res_id: res_id,
        api_data2: [swiggyData, zomatoData],
        listingID: listingID !== "" ? listingID : listing_id,
      },
      status: "success",
    });
  } catch (err) {
    console.log("Error:", err);
    console.log("---------- <Get All Data Error End> ----------------");
    res.json({
      status: "error",
      message: `Error while getting data :${err}`,
    });
  }
});

// ! check swiggy Number
router.post("/check-swiggy-number", async (req, res) => {
  const { swiggy_register_phone, swiggy_password } = req.body;
  const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));
  const swiggyURL =
    "https://partner.swiggy.com/registration/v2/registration-status?userId=";

  const swiggyPasswordCheckURL =
    "https://partner.swiggy.com/authentication/v1/login";

  try {
    console.log(swiggy_register_phone);
    const swiggyNumberResponse = await (
      await fetch(`${swiggyURL}${swiggy_register_phone}`)
    ).json();

    console.log(swiggyNumberResponse);
    const { statusCode, statusMessage } = swiggyNumberResponse;
    const userPresentMessage =
      "User already registered with this mobile number";
    const userNotPresentMessage = "Invalid Mobile Number";

    // ? if in future swiggy api response json is changed
    if (statusCode === undefined || statusMessage === undefined) {
      res.json({
        status: "error",
        message: `Server Error While Checking Swiggy Number, Please Try Again Later`,
      });
      return;
    }

    // ? if swiggy number is not registered this the response
    if (statusCode === -1 || statusMessage === userNotPresentMessage) {
      return res.json({
        status: "error",
        message: `This Number is not registered With Swiggy!`,
      });
    }

    // ? if swiggy number is registered then,
    // *now check password!
    if (statusCode === -2 || statusMessage === userPresentMessage) {
      // console.log("swiggy check", swiggy_register_phone, swiggy_password);
      const userPasswordCorrectMessage = "Login Successful";
      const userPasswordIncorrectMessage = "incorrect password entered";

      const swiggyPasswordResponse = await (
        await fetch(`${swiggyPasswordCheckURL}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username: swiggy_register_phone,
            password: swiggy_password,
            accept_tnc: true,
          }),
        })
      ).json();

      console.log(
        swiggyPasswordResponse,
        "swiggyPasswordResponse",
        "********************--------------------------"
      );

      const {
        statusCode,
        statusMessage,
        user_id: user_register_phone,
        permissions,
        outlets,
      } = swiggyPasswordResponse;

      // ! now if statusCode is -1 then password is wrong, and 0 means success
      if (statusCode === 0 || statusMessage === userPasswordCorrectMessage) {
        return res.json({
          status: "success",
          message: `Your Swiggy Password is correct!`,
        });
      }

      if (statusCode === -1 || statusMessage === userPasswordIncorrectMessage) {
        return res.json({
          status: "error",
          message: `Password is incorrect!`,
        });
      }

      // * if  no match found then return server error
      return res.json({
        status: "error",
        message: `Server Error While Checking Swiggy Password, Please Try Again Later`,
      });
    }
  } catch (err) {
    res.json({
      status: "error",
      message: `Error while checking swiggy number :${err}`,
    });
  }
});

// Todo: check nvdp collection
// ?if yes, then send the token
// ?if no, (create a temp auth) then send the onboarding product -> no,create a new user |*|-> yes, send user data
// Todo token expire time remove

// Todo: now for UAT
// ! signup and login
router.post("/login-voosh", async (req, res) => {
  const { phoneNumber } = req.body;
  // const onboardProductsColleaction = "onboard_products";
  const onboardProductsColleaction = "Onboard_New_Users_UAT";

  const nvdpColleaction = "non_voosh_dashboard_products";

  try {
    const client = await MongoClient.connect(VooshDB, {
      useNewUrlParser: true,
    });

    // !testing purpose
    // ? You Me and Tea
    // ?CFH
    const test_number = {
      1234567890: 9886850338,
      1234554321: 9448467130,
    };
    let customPhoneNumber;

    if (test_number[phoneNumber]) {
      customPhoneNumber = test_number[phoneNumber];
    } else {
      customPhoneNumber = phoneNumber;
    }

    console.log(customPhoneNumber, typeof customPhoneNumber);

    const db = client.db(documentName);
    // ! manually connection this number to CFH
    const isUserPresentInNVDP = await db.collection(nvdpColleaction).findOne({
      owner_number: parseInt(customPhoneNumber),
    });
    console.log("isUserPresentInNVDP", isUserPresentInNVDP);

    // ! if user present in NVDP then send the token
    if (isUserPresentInNVDP !== null || isUserPresentInNVDP) {
      const { owner_number: phone, _id: id } = isUserPresentInNVDP;

      const getAllSwiggyAndZomatoRestaurantsData =
        await getAllSwiggyAndZomatoRestaurants(phone);
      newRestaurantList = [...getAllSwiggyAndZomatoRestaurantsData];
      // ? cuz the number is on nvdp so ek obj tho sure hoga!
      const { listing_id, restaurant_name, swiggy_res_id, zomato_res_id } =
        newRestaurantList[0];

      const token = jwt.sign(
        {
          id,
          phone,
          listing_id,
          restaurant_name,
          swiggy_res_id,
          zomato_res_id,
        },
        secret,
        {
          // expiresIn: 3000 * 3, //50min->3000
        }
      );

      return res.json({
        status: "success",
        isAuth: true,
        isAuthTemp: false,
        token: token,
        restaurantList: newRestaurantList,
        restaurantDetails: {
          listing_id,
          restaurant_name,
          swiggy_res_id,
          zomato_res_id,
        },
      });
    }

    // ! not present in NVDP then check on Onboard Products
    // Todo create toke for every response
    else {
      const token = jwt.sign({ phone: phoneNumber, tempUser: true }, secret, {
        // expiresIn: 3000 * 3, //50min*3->3000
        // expiresIn: 3000 *3, //50min
      });

      // console.log(parseInt(phoneNumber) === 0123401234, phoneNumber, typeof phoneNumber);
      if (parseInt(phoneNumber) === 0123401234) {
        res.json({
          status: "success",
          message: "Test User",
          isAuthTemp: true,
          isSwiggyNumberPresent: false,
          isZomatoNumberPresent: false,
          token: token,
        });
        console.log("Test User");
        return;
      }

      const isUserPresentInOnboardProducts = await db
        .collection(onboardProductsColleaction)
        .findOne({ phone: parseInt(phoneNumber) });

      console.log(
        "isUserPresentInOnboardProducts",
        isUserPresentInOnboardProducts
      );

      //? if user present in onboard products then grab the data!
      if (isUserPresentInOnboardProducts !== null) {
        const { zomato_register_phone, swiggy_register_phone } =
          isUserPresentInOnboardProducts;
        //? if numbers are not present in swiggy or zomato then set flag to false or true

        res.json({
          status: "success",
          message: "User already exists",
          isAuthTemp: true,
          isSwiggyNumberPresent:
            `${swiggy_register_phone}`.length === 10 ? true : false,
          isZomatoNumberPresent:
            `${zomato_register_phone}`.length === 10 ? true : false,
          user: isUserPresentInOnboardProducts,
          isDataReady: false,
          token: token,
        });
      }
      // ? if phone not present, create entery in db
      else {
        await db.collection(onboardProductsColleaction).insertOne({
          restaurant_name: "",
          phone: parseInt(phoneNumber),
          join_date: new Date(),
          swiggy_register_phone: "",
          swiggy_password: "",
          zomato_register_phone: "",
        });
        res.json({
          status: "success",
          message: "New user created",
          isAuthTemp: true,
          isSwiggyNumberPresent: false,
          isZomatoNumberPresent: false,
          token: token,
        });
      }
    }
  } catch (err) {
    // ! Error while connecting to DB, or While Querying
    console.log("Error while saving user: " + err);
    res.json({
      status: "error",
      isAuthTemp: false,
      message: "Error while saving user, Server Error",
      isSwiggyNumberPresent: false,
      isZomatoNumberPresent: false,
      isDataReady: false,
    });
  }
});

// Todo: now for UAT
// ! for saving only phone numbers
router.post("/user/save-only-number", async (req, res) => {
  const { phoneNumber } = req.body;

  if (parseInt(phoneNumber) === "0123401234") {
    res.json({
      status: "success",
      message: "Test User",
    });
    return;
  }

  // const save_all_users_number = "save_all_users_number";
  const save_all_users_number = "save_all_users_number_UAT";
  try {
    const client = await MongoClient.connect(VooshDB, {
      useNewUrlParser: true,
    });
    const db = client.db(documentName);

    const isUserPresent = await db
      .collection(save_all_users_number)
      .findOne({ phone: parseInt(phoneNumber) });

    if (isUserPresent !== null) {
      res.json({
        status: "success",
        message: "User already exists, no need to save number",
      });
    } else {
      await db.collection(save_all_users_number).insertOne({
        phone: parseInt(phoneNumber),
        first_seen: new Date(),
      });
      res.json({
        status: "success",
        message: "new number saved",
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      status: "error",
      message: "Error while saving number, Server Error",
    });
  }
});

// Todo: now in future we will use this route, for check the nvdp collection cuz
// Todo: we are gonna keep the token without expiry time
// Todo: if user is present in nvdp then send the a new token and with restaurant data
// ! user data who are present in onboard products

// Todo: now for UAT
router.post("/user/onboard-data", checkAuthentication, async (req, res) => {
  console.log("hit onboard data");
  const { phone, tempUser } = req.payload;

  if (phone === "0123401234") {
    res.json({
      status: "success",
      phone,
      isAuthTemp: tempUser,
      userDetails: {
        name: "",
        email: "",
        restaurantName: "test",
        phoneNumber: 0123401234,
      },
      dataSubmitted: false,
    });
    return;
  }

  try {
    const client = await MongoClient.connect(VooshDB, {
      useNewUrlParser: true,
    });
    const db = client.db(documentName);
    // const onboardProductsColleaction = "onboard_products";
    const onboardProductsColleaction = "Onboard_New_Users_UAT";

    const userData = await db
      .collection(onboardProductsColleaction)
      .findOne({ phone: parseInt(phone) });

    const { swiggy_register_phone, zomato_register_phone } = userData;

    console.log("userData", userData);
    res.json({
      status: "success",
      phone,
      isAuthTemp: tempUser,
      userDetails: userData,
      dataSubmitted:
        swiggy_register_phone !== "" || zomato_register_phone !== ""
          ? true
          : false,
    });
  } catch (err) {
    res.json({
      status: "error",
      message: "Error while sending data from server data",
      error: err,
      dataSubmitted: false,
    });
  }
});

//! Update onboard Users
// Todo: now for UAT
router.post(
  "/user/update/onboard-data",
  checkAuthentication,
  async (req, res) => {
    console.log("hit onboard data");
    const { phone, tempUser } = req.payload;

    if (parseInt(phone) === "0123401234") {
      res.json({
        status: "success",
        message: "User data updated",
      });

      return;
    }

    const {
      // name,
      // email,
      restaurant_name,
      swiggy_register_phone,
      zomato_register_phone,
    } = req.body;
    try {
      const client = await MongoClient.connect(VooshDB, {
        useNewUrlParser: true,
      });
      const db = client.db(documentName);
      // const onboardProductsColleaction = "onboard_products";
      const onboardProductsColleaction = "Onboard_New_Users_UAT";

      const query = { phone: parseInt(phone) };
      const update = {
        $set: {
          // name,
          // email,
          restaurant_name,
          swiggy_register_phone: parseInt(swiggy_register_phone),
          zomato_register_phone: parseInt(zomato_register_phone),
        },
      };
      db.collection(onboardProductsColleaction).updateOne(
        query,
        update,
        (err, result) => {
          if (err) {
            res.json({
              status: "error",
              message: "Error while saving user, Server Error",
              error: err,
            });
          } else {
            res.json({
              status: "success",
              message: "User data updated",
              isAuthTemp: tempUser,
              userDetails: result,
            });
          }
        }
      );
    } catch (err) {
      res.json({
        status: "error",
        message: "Error while sending data from server data",
        error: err,
      });
    }
  }
);

// Todo: Now for UAT
// ! request call
router.post("/user/call-request", async (req, res) => {
  try {
    const { flagName, phoneNumber } = req.body;
    console.log("flagName", flagName);
    console.log("phoneNumber", phoneNumber);

    if (parseInt(phoneNumber) === 0123401234) {
      res.json({
        status: "success",
        message: "Still having problem, Someone will call you soon",
      });
      return;
    }

    // const collectionName = "flags_banners_products";
    const collectionName = "flags_banners_products_UAT";
    const client = await MongoClient.connect(VooshDB, {
      useNewUrlParser: true,
    });

    // ? first check if user is present in flags_banners_products
    const db = await client.db(documentName);

    const isNumberPresent = await db.collection(collectionName).findOne({
      phone: parseInt(phoneNumber),
      flag_name: flagName,
    });

    console.log(isNumberPresent);

    if (isNumberPresent !== null) {
      const { flag_status } = isNumberPresent;

      // ? if flag is already present then update the status
      if (flag_status === "resolved") {
        await db.collection(collectionName).insertOne({
          phone: parseInt(phoneNumber),
          flag_name: flagName,
          time_stamp: new Date(),
          flag_status: "pending",
        });

        res.json({
          status: "success",
          message: "Still having problem, Someone will call you soon",
        });
      }
      // ? if number is not resolved then send sms
      else {
        res.json({
          status: "success",
          message: "Your Request is being processed",
        });
      }
    }
    // ? this request happen for the first timne
    else {
      // console.log("44");
      const userData = await db.collection(collectionName).insertOne({
        phone: parseInt(phoneNumber),
        flag_name: flagName,
        time_stamp: new Date(),
        flag_status: "pending",
      });
      res.json({
        status: "success",
        message: "Voosh will call back within 24 hours ",
        user: userData,
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      status: "error",
      message: "Error while sending data from server data",
      error: err,
    });
  }
});

//! test route
router.post("/test-101", async (req, res) => {
  // const { phone } = req.body;
  // const nvdpColleaction = "non_voosh_dashboard_products";
  // const zomatoNvdpColleaction = "zomato_nvdp";
  // try {
  //   const client = await MongoClient.connect(VooshDB, {
  //     useNewUrlParser: true,
  //   });
  //   const db = client.db(documentName);
  //   const userData = await db.collection(nvdpColleaction).findOne({ phone });
  //   if (userData) {
  //     const { kitchen_id } = userData;
  //     const swiggyData = await db
  //       .collection(nvdpColleaction)
  //       .find({ kitchen_id: kitchen_id })
  //       .toArray();
  //     const zomatoData = await db
  //       .collection(zomatoNvdpColleaction)
  //       .find({ kitchen_id: kitchen_id })
  //       .toArray();
  //     const sLid = swiggyData.map((i) => i.listing_id);
  //     const zLid = zomatoData.map((i) => i.listing_id);
  //     const allIds = [...new Set([...sLid, ...zLid])];
  //     const finalData = allIds.map((Lid, i) => {
  //       const s_data = swiggyData.find((item) => item.listing_id === Lid);
  //       const z_data = zomatoData.find((item) => item.listing_id === Lid);
  //       const swiggy_res_id = s_data?.swiggy_res_id;
  //       const zomato_res_id = z_data?.zomato_res_id;
  //       const restaurant_name =
  //         s_data !== undefined
  //           ? s_data.restaurant_name
  //           : z_data.zomato_nomenclature;
  //       return {
  //         restaurant_name,
  //         listing_id: Lid,
  //         swiggy_res_id: swiggy_res_id === undefined ? null : swiggy_res_id,
  //         zomato_res_id: zomato_res_id === undefined ? null : zomato_res_id,
  //         // swiggy: {
  //         //   ...s_data,
  //         // },
  //         // zomato: {
  //         //   ...z_data,
  //         // },
  //       };
  //     });
  //     res.json({
  //       // swiggy: swiggyData,
  //       // zomato: zomatoData,
  //       // sLid,
  //       // zLid,
  //       // allIds,
  //       finalData,
  //     });
  //   } else {
  //     res.json({
  //       user: userData,
  //     });
  //   }
  // } catch (err) {
  //   // ? if error happens
  //   res.json({
  //     Error: err,
  //   });
  // }
});

// ? zomato lsitings
router.post("/test-listing", async (req, res) => {
  const { res_id } = req.body;
  const collectionName = "zomato_audit_score";
  try {
    const client = await MongoClient.connect(VooshDB, {
      useNewUrlParser: true,
    });
    const db = client.db(documentName);
    const userData = await db
      .collection(collectionName)
      .findOne({ zomto_res_id: res_id });

    const result = {
      delivery_no_review: userData?.delivery_no_review,
      delivery_review: userData?.delivery_review,
      offer_1: userData?.offer_1,
      offer_2: userData?.offer_2,
      offer_3: userData?.offer_3,
      offer_4: userData?.offer_4,

      beverages_category: userData?.beverages,
      desserts: userData?.dessert,
      safety_tag: userData?.safety,
      //?  .30701754385964913 --> 30%
      Image: userData?.images,
      //?  1 -> 100%
      description: userData?.description,
    };

    res.json({
      user: userData,
    });
  } catch (err) {
    res.json({
      Error: err,
    });
  }
});

module.exports = router;

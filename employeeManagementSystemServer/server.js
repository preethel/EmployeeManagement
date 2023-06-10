const express = require("express");
const fs = require("fs").promises;
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
// Import the jsonwebtoken library
const jwt = require("jsonwebtoken");

app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

/*-----Sign Up------- */
app.post("/api/signUp", async (req, res) => {
  const signUpUser = req.body;
  console.log(signUpUser);
  // Read the existing data from the JSON file
  let existingData = [];
  let existingEmployeeData = [];

  try {
    const data = await fs.readFile("db/signInUser.json", "utf8");
    existingData = JSON.parse(data);

    let usernameExists = existingData.find(
      (element) => element.username === signUpUser.username
    );

    if (usernameExists) {
      return res.status(400).json({
        error: "Username already exists. Please choose a different username.",
      });
    }
    const employeeData = await fs.readFile("db/employeeEntry.json", "utf8");
    existingEmployeeData = JSON.parse(employeeData);
  } catch (err) {
    existingData = [];
  }

  let uId = existingData.length;
  const userId = uId + 1;
  const signUpUserWithId = {
    ...signUpUser,
    id: userId,
  };

  const employeeEntry = {
    id: userId,
    entry: [],
  };

  existingData.push(signUpUserWithId);
  existingEmployeeData.push(employeeEntry);

  try {
    await fs.writeFile("db/signInUser.json", JSON.stringify(existingData));
    await fs.writeFile(
      "db/employeeEntry.json",
      JSON.stringify(existingEmployeeData)
    );

    res.json({ message: "User data and Employee Entry stored successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to store data" });
  }
});

/*-------Sign In User-------*/
app.post("/api/signIn", async (req, res) => {
  const signInUser = req.body;
  let existingData;
  try {
    const data = await fs.readFile("db/signInUser.json", "utf8");
    existingData = JSON.parse(data);
  } catch (err) {
    existingData = [];
  }
  // Checking if the signInUser exists in existingData
  const userExists = existingData.find((user) => {
    return (
      user.username === signInUser.username &&
      user.password === signInUser.password
    );
  });
  const currentUserName = userExists?.username;
  const currentUserId = userExists?.id;

  if (userExists) {
    const token = jwt.sign(
      { username: currentUserName, id: currentUserId },
      "redwan",
      {
        expiresIn: "11111h", // Optionally set the token expiration time
      }
    );
    // console.log(token);
    return res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

/*-----GET Employee--- */
app.get("/api/getEmployeeEnties", async (req, res) => {
  const token = req.headers.authentication;
  let existingData;

  try {
    const decoded = jwt.verify(token, "redwan");

    const userId = decoded.id;
    if (!userId)
      return res.status(400).json({ error: "User must be authorized." });

    const data = await fs.readFile("db/employeeEntry.json", "utf8");
    existingData = JSON.parse(data);

    if (existingData) {
      // existingData = JSON.parse(data);
      const matchedItem = existingData?.find((i) => i.id === userId);
      if (matchedItem) {
        const searchingFor = req.query;
        console.log(searchingFor.department);

        const matchedItemEntries = matchedItem.entry;
        const searchedItem = matchedItemEntries.filter((item) => {
          return (
            (searchingFor.name === "" || item.name === searchingFor.name) &&
            (searchingFor.gender === "" ||
              item.gender === searchingFor.gender) &&
            (searchingFor.birthdate === "" ||
              item.birthdate === searchingFor.birthdate) &&
            (searchingFor.department === "" ||
              item.department === searchingFor.department) &&
            (searchingFor.email === "" || item.email === searchingFor.email) &&
            (searchingFor.phone === "" || item.phone === searchingFor.phone)
          );
        });
        console.log(searchedItem);

        return res.status(200).json(searchedItem);
      } else {
        return res.status(404).json({ message: "Data not found" });
      }
    } else {
      existingData = [];
    } // If the file is empty, initialize existingData as an empty array// employeeList.js file a ay shala
  } catch (error) {
    console.error("error", error);
  }
});

/*------POST Employee----- */
app.post("/api/employeeEntry", async (req, res) => {
  const entry = req.body;
  const token = req.headers.authentication;

  let existingData;

  try {
    const decoded = jwt.verify(token, "redwan");

    const userId = decoded.id;
    if (!userId)
      return res.status(400).json({ error: "User must be authorized." });

    const data = await fs.readFile("db/employeeEntry.json", "utf8");
    existingData = JSON.parse(data);
    // console.log("existingData =>", existingData)

    if (existingData) {
      // existingData = JSON.parse(data);
      const matchedItem = existingData?.find((i) => i.id === userId);
      if (matchedItem) {
        const entries = matchedItem.entry;
        // console.log(typeof entries)
        // console.log("entries =>", entries)
        entries.push(entry);
        // Store the form data in a JSON file
        await fs.writeFile(
          "db/employeeEntry.json",
          JSON.stringify(existingData)
        );
        return res.status(200).json({ entries });

        // try now
      } else {
        return res.status(404).json({ message: "Data not found" });
      }
    } else {
      existingData = []; // If the file is empty, initialize existingData as an empty array
    }
  } catch (error) {
    console.error("error", error);
  }
});

/*------PUT Employee------*/
app.put("/api/employeeEntry/:id", async (req, res) => {
  const entryId = req.params.id;
  const updatedEntry = req.body;
  const token = req.headers.authentication;

  let existingData;

  // console.log("updatedEntry =>",updatedEntry);
  try {
    const decoded = jwt.verify(token, "redwan");

    const userId = decoded.id;
    if (!userId)
      return res.status(400).json({ error: "User must be authorized." });

    const data = await fs.readFile("db/employeeEntry.json", "utf8");
    existingData = JSON.parse(data);

    if (existingData) {
      const matchedItem = existingData.find((i) => i.id === userId);
      // console.log("match => ", matchedItem);
      if (matchedItem) {
        const entries = matchedItem.entry;

        // const entryToUpdate = entries.find(e => e.id === entryId);
        console.log("entryToUpdate => ", entries[entryId]);
        /*
                conteies = []
                */
        if (entries[entryId]) {
          // Update the entry with the new data
          entries[entryId] = updatedEntry;
          // Store the updated data in the JSON file
          await fs.writeFile(
            "db/employeeEntry.json",
            JSON.stringify(existingData)
          );

          return res
            .status(200)
            .json({ message: "Entry updated successfully." });
        } else {
          return res.status(404).json({ message: "Entry not found." });
        }
      } else {
        return res.status(404).json({ message: "Data not found." });
      }
    } else {
      existingData = []; // If the file is empty, initialize existingData as an empty array
    }
  } catch (error) {
    console.error("error", error);
  }
});

/*------DELETE Employee------*/
app.delete("/api/employeeEntry/:id", async (req, res) => {
  const entryId = req.params.id;
  const token = req.headers.authentication;

  let existingData;
  try {
    const decoded = jwt.verify(token, "redwan");

    const userId = decoded.id;
    if (!userId)
      return res.status(400).json({ error: "User must be authorized." });

    const data = await fs.readFile("db/employeeEntry.json", "utf8");
    existingData = JSON.parse(data);

    if (existingData) {
      const matchedItem = existingData.find((i) => i.id === userId);
      // console.log("match => ", matchedItem);
      if (matchedItem) {
        const entries = matchedItem.entry;
        // console.log("matchedItem => ", entries);

        // const entryIndex = entries.findIndex(e => e.id === entryId);
        const entryIndex = entryId;
        // console.log("entryIndex => ", entryIndex);
        if (entryIndex >= 0) {
          // Remove the entry from the array
          entries.splice(entryIndex, 1);

          // Store the updated data in the JSON file
          await fs.writeFile(
            "db/employeeEntry.json",
            JSON.stringify(existingData)
          );

          return res
            .status(200)
            .json({ message: "Entry deleted successfully." });
        } else {
          return res.status(404).json({ message: "Entry not found." });
        }
      } else {
        return res.status(404).json({ message: "Data not found." });
      }
    } else {
      existingData = []; // If the file is empty, initialize existingData as an empty array
    }
  } catch (error) {
    console.error("error", error);
  }
});
const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

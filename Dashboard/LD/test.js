import { auth, db } from "./firebase.js";
import checkAuth from "./google.js";
import { updateCalculator } from "./newone.js";
import { addDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

checkAuth(); // Ensure the user is authenticated


window.getLabourEntries = async function () {
    const user = auth.currentUser;
    if (!user) {
        console.warn("No user is logged in!");
        return []; // Return empty array if not logged in
    }

    try {
        const userLabourCollection = collection(db, `users/${user.uid}/labourEntries`);
        const querySnapshot = await getDocs(userLabourCollection);
        return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })); // Map with doc.id
    } catch (error) {
        console.error("Error fetching labour entries from Firebase:", error);
        return []; // Return empty array on error
    }
};
// Function to save a new labour entry to local storage


document.addEventListener("DOMContentLoaded", () => {

    const entries = getLabourEntries();
    const currentMonthElem = document.getElementById("currentMonth");
    const popup = document.getElementById("popup");
    const addLabourBtn = document.getElementById("addLabourBtn");
    const bottomMenu = document.getElementById("bottomMenu");
    const closePopup = document.getElementById("closePopup");
    const createLabourBtn = document.getElementById("createLabourBtn");
    const labourContent = document.getElementById("labourContent");
    const placeholder = document.getElementById("placeholder");
    const categoryPopup = document.getElementById("categoryPopup");
    const addCategoryBtn = document.getElementById("addCategoryBtn");
    const closeCategoryPopup = document.getElementById("closeCategoryPopup");
    const saveCategoryBtn = document.getElementById("saveCategory");
    const labourCategory = document.getElementById("labourCategory");
    const newCategoryInput = document.getElementById("newCategory");
    // Show Labour Form popup
    addLabourBtn.addEventListener("click", () => {
        popup.style.display = "flex";
    });

    // Close Labour Form popup
    closePopup.addEventListener("click", () => {
        popup.style.display = "none";
    });

    // Show Add Category popup
    addCategoryBtn.addEventListener("click", (e) => {
        e.preventDefault();
        categoryPopup.style.display = "flex";
    });

    // Close Add Category popup
    closeCategoryPopup.addEventListener("click", () => {
        categoryPopup.style.display = "none";
    });

    // Save new category
    saveCategoryBtn.addEventListener("click", () => {
        const newCategory = newCategoryInput.value.trim();
        if (newCategory) {
            const option = document.createElement("option");
            option.value = newCategory.toLowerCase();
            option.textContent = newCategory;
            labourCategory.appendChild(option);

            // Select the newly added category
            labourCategory.value = newCategory.toLowerCase();

            // Clear the input and close the popup
            newCategoryInput.value = "";
            categoryPopup.style.display = "none";
        } else {
            alert("Please enter a category name.");
        }
    });
    // Function to generate a unique ID
    function generateUniqueId() {
        return Date.now().toString(); // Use the current timestamp as a unique ID
    }

    // Function to save a new labour entry   
    window.saveLabourEntry = async function (entry) {
        const localEntries = await window.getLabourEntries(); // Ensure it returns an array
        localEntries.push(entry);
        localStorage.setItem("labourEntries", JSON.stringify(localEntries));
    
        const user = auth.currentUser;
        if (user) {
            try {
                const userLabourCollection = collection(db, `users/${user.uid}/labourEntries`);
                await addDoc(userLabourCollection, entry);
                console.log("Entry saved to Firebase successfully!");
            } catch (error) {
                console.error("Error saving entry to Firebase:", error);
            }
        } else {
            console.warn("User is not logged in. Skipping Firebase save.");
        }
    };

    // Event listener for Create Labour button
    createLabourBtn.addEventListener("click", () => {
        const labourName = document.getElementById("labourName").value.trim();

        if (!labourName) {
            alert("Please enter a name.");
            return;
        }

        // Retrieve form values
        const salaryType = document.getElementById("salaryType").value;
        const ratePerDay = document.getElementById("ratePerDay").value;
        const labourCategory = document.getElementById("labourCategory").value;
        const aadharNumber = document.getElementById("aadharNumber").value.trim();
        const startDate = document.getElementById("startDate").value;
        const additionalDetails = document.getElementById("additionalDetails").value.trim();

        // Validate required fields
        if (!labourName || !ratePerDay || !labourCategory || !startDate) {
            alert("Please fill in all required fields.");
            return;
        }

        // Create a new labour entry object
        const newEntry = {
            id: generateUniqueId(),
            labourName,
            salaryType,
            ratePerDay: parseFloat(ratePerDay),
            labourCategory,
            aadharNumber: aadharNumber || null, // Optional
            startDate,
            additionalDetails: additionalDetails || null, // Optional
            status: null, // Default status
            attendance: [], // Initialize an empty attendance array
        };

        // Save the new entry to local storage
        saveLabourEntry(newEntry);

        // Dynamically create the labour entry wrapper
        const labourEntryWrapper = document.createElement("div");
        labourEntryWrapper.className = "labour-entry-wrapper";
        labourEntryWrapper.setAttribute("data-id", newEntry.id); // Assign the unique ID

        // Create action buttons
        const actionButtons = document.createElement("div");
        actionButtons.className = "action-buttons";

        const pButton = document.createElement("button");
        pButton.textContent = "P";
        pButton.className = "action-btn green";

        const aButton = document.createElement("button");
        aButton.textContent = "A";
        aButton.className = "action-btn red";

        const otButton = document.createElement("button");
        otButton.textContent = "OT";
        otButton.className = "action-btn orange";

        const hButton = document.createElement("button");
        hButton.textContent = "H";
        hButton.className = "action-btn grey";

        // Append action buttons to the actionButtons container
        actionButtons.appendChild(pButton);
        actionButtons.appendChild(aButton);
        actionButtons.appendChild(otButton);
        actionButtons.appendChild(hButton);

        // Create the main labour entry button
        const labourEntryButton = document.createElement("button");
        labourEntryButton.className = "labour-entry-btn";

        const nameSpan = document.createElement("span");
        nameSpan.className = "labour-name";
        nameSpan.textContent = labourName;

        const tapHoldSpan = document.createElement("span");
        tapHoldSpan.className = "tap-hold";
        tapHoldSpan.textContent = "Tap & hold for more options";

        // Append name and text to the labour entry button
        labourEntryButton.appendChild(nameSpan);
        labourEntryButton.appendChild(tapHoldSpan);

        // Combine the action buttons and main entry button into the wrapper
        labourEntryWrapper.appendChild(actionButtons);
        labourEntryWrapper.appendChild(labourEntryButton);

        // Replace placeholder text with the new entry
        if (placeholder) {
            placeholder.remove();
        }

        // Insert the new entry before the Add Labour button
        labourContent.insertBefore(labourEntryWrapper, addLabourBtn);

        // Call the function to add listeners to newly created entries
        addLongPressListeners();

        // Close the popup
        popup.style.display = "none";

        alert(`Labour entry for ${labourName} has been created successfully!`);
    });
});

// Function to show the sliding form for OT
function showOvertimeForm(name) {
    const overtimeForm = document.getElementById("overtimeForm");
    const overtimeName = document.getElementById("overtimeName");

    overtimeName.textContent = `Overtime for: ${name}`;
    overtimeForm.classList.add("visible");
}

// Function to hide the sliding form
function hideOvertimeForm() {
    const overtimeForm = document.getElementById("overtimeForm");
    overtimeForm.classList.remove("visible");
}

// Function to save overtime details
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

async function saveOvertimeDetails() {
    const labourId = document.querySelector(".popup .title").dataset.labourId; // Get labour ID from the popup
    const hours = parseFloat(document.getElementById("overtimeHours").value);
    const rate = parseFloat(document.getElementById("overtimeRate").value);

    if (!hours || !rate || isNaN(hours) || isNaN(rate)) {
        alert("Please fill in valid hours and rate.");
        return;
    }

    try {
        // Verify the authenticated user
        const user = auth.currentUser;
        if (!user) {
            console.error("No authenticated user found.");
            alert("You must be logged in to save overtime details.");
            return;
        }

        // Reference the labor document in Firestore
        const labourDocRef = doc(db, `users/${user.uid}/labourEntries`, labourId);

        // Fetch the labor entry document
        const labourDocSnapshot = await getDoc(labourDocRef);
        if (!labourDocSnapshot.exists()) {
            console.warn(`Labour entry with ID "${labourId}" not found.`);
            alert("Labour entry not found.");
            return;
        }

        const labourEntry = labourDocSnapshot.data();

        // Get the selected date from the popup
        const date = document.querySelector(".popup1 .popup-date").textContent;

        // Ensure attendance exists for the selected date
        let attendance = labourEntry.attendance?.find((a) => a.date === date);
        if (!attendance) {
            attendance = { date, status: "OT", advances: [], overtime: null };
            labourEntry.attendance = labourEntry.attendance || [];
            labourEntry.attendance.push(attendance);
        }

        // Update overtime details
        attendance.status = "OT";
        attendance.overtime = { hours, rate };

        // Save updated attendance back to Firestore
        await updateDoc(labourDocRef, { attendance: labourEntry.attendance });

        alert(`Overtime saved for Labour ID "${labourId}": ${hours} hours @ ${rate}/hour`);

        // Update the calculator for the specific labour
        updateCalculator(labourId);

        // Update the UI dynamically
        const spreadsheetRow = document.querySelector(`.spreadsheet .row[data-date="${date}"]`);
        if (spreadsheetRow) {
            spreadsheetRow.querySelector(".cell:nth-child(2)").innerHTML = `
                OT<br>${hours}h @ ${rate}/hr
            `;
        }

        hideOvertimeForm();
    } catch (error) {
        console.error("Error saving overtime details:", error);
        alert("An error occurred while saving overtime details. Please try again.");
    }
}
// Add event listener for OT button
document.addEventListener("click", (event) => {
    if (event.target.textContent === "OT") {
        const labourId = document.querySelector(".popup .title").dataset.labourId;
        const date = document.querySelector(".popup1 .popup-date").textContent;

        // Open overtime form
        const labourName = document.querySelector(".popup1 .labour-name").textContent;
        document.getElementById("overtimeName").textContent = `Overtime for: ${labourName}`;
        document.getElementById("overtimeForm").classList.add("visible");
    }
});
// Event listeners for form buttons
document.getElementById("overtimeSave").addEventListener("click", saveOvertimeDetails);
document.getElementById("overtimeCancel").addEventListener("click", hideOvertimeForm);
// Utility function to get or initialize local storage data
function getLabourData(name) {
    const entries = getLabourEntries();
    return entries.find((labour) => labour.labourName === name) || null;
}
// Utility function to update local storage
function updateLabourData(name, newData) {
    const data = getLabourData(name);
    const updatedData = { ...data, ...newData };
    localStorage.setItem(name, JSON.stringify(updatedData));
}

// Function to handle the "P", "A", and "H" actions
function updateLabourStatus(button, status) {
    const wrapper = button.closest(".labour-entry-wrapper");
    const name = wrapper.querySelector(".labour-name").textContent;

    const entries = getLabourEntries();
    const entry = entries.find((labour) => labour.labourName === name);

    if (!entry) {
        alert("Labour entry not found.");
        return;
    }

    if (entry.status === status) {
        alert(`Current Status: ${status} `);
    } else {
        if (status !== "Overtime") {
            delete entry.overtime; // Remove overtime field for non-OT actions
        }
        entry.status = status; // Update the status field
        localStorage.setItem("labourEntries", JSON.stringify(entries));
        alert(`${name} marked as ${status}.`);
        console.log("Updated Entries:", getLabourEntries());
    }
}
function clearOtherStates(entry) {
    delete entry.overtime; // Remove overtime
    entry.status = null;   // Clear status
}
// Add a single listener for all status buttons
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("action-btn")) {
        const button = event.target;
        const statusMap = { P: "P", A: "A", OT: "OT", H: "H" };

        if (statusMap[button.textContent]) {
            const wrapper = button.closest(".labour-entry-wrapper");
            const name = wrapper.querySelector(".labour-name").textContent;

            const entries = getLabourEntries();
            const entry = entries.find((labour) => labour.labourName === name);

            if (!entry) {
                alert("Labour entry not found.");
                return;
            }

            // Check if the action is already triggered
            const currentStatus = entry.status;

            if (currentStatus === statusMap[button.textContent]) {
                // If the same action is already triggered, reset status to null
                entry.status = null;
                alert(`Status cleared for ${name}`);
            } else {
                // Otherwise, update the status to the new action
                entry.status = statusMap[button.textContent];
                alert(`${name} marked as ${statusMap[button.textContent]}`);
            }

            // Save updated entry back to local storage
            localStorage.setItem("labourEntries", JSON.stringify(entries));

            console.log("Updated Entries:", getLabourEntries());
        }
    }
});

// Function to toggle visibility and slide tapped button
function toggleActionButtons(wrapper, tappedButton) {
    const actionButtons = Array.from(wrapper.querySelectorAll(".action-btn"));

    // Check if the other buttons are currently hidden
    const areHidden = actionButtons.some(
        (button) => button !== tappedButton && button.classList.contains("hidden")
    );

    if (!areHidden) {
        // Hide other buttons and slide the tapped button to the end
        actionButtons.forEach((button, index) => {
            if (button === tappedButton) {
                // Add sliding effect by setting an order
                button.style.order = actionButtons.length; // Move to end
                button.classList.add("bounce"); // Add bounce effect
                setTimeout(() => button.classList.remove("bounce"), 500); // Remove class after animation
            } else {
                button.classList.remove("show");
                button.classList.add("hidden");
            }
        });
    } else {
        // Show all buttons and reset their order
        actionButtons.forEach((button) => {
            button.style.order = ""; // Remove any custom ordering
            button.classList.remove("hidden");
            button.classList.add("show");
        });
    }
}

// Unique actions for each button
function handleButtonAction(button) {
    switch (button.textContent) {
        case "P":
            alert("Present action triggered!");
            break;
        case "A":
            alert("Absent action triggered!");
            break;
        case "OT":
            alert("Overtime action triggered!");
            break;
        case "H":
            alert("Halfday action triggered!");
            break;
        default:
            console.log("Unknown action");
    }
}

// Add event listeners for each action button
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("action-btn")) {
        const wrapper = event.target.closest(".labour-entry-wrapper");
        const tappedButton = event.target;

        // Handle button-specific action
        handleButtonAction(tappedButton);

        // Call the toggle function for visibility and sliding effect
        toggleActionButtons(wrapper, tappedButton);
    }
});
let longPressTimeout;
let selectedEntryId = null; // To track the entry being operated on

// Function to show the bottom menu
function showBottomMenu() {
    const bottomMenu = document.getElementById("bottomMenu");
    bottomMenu.classList.add("visible");
}

// Function to hide the bottom menu
function hideBottomMenu() {
    const bottomMenu = document.getElementById("bottomMenu");
    bottomMenu.classList.remove("visible");
}

// Add long-press event listeners to labour entries
function addLongPressListeners() {
    const labourEntries = document.querySelectorAll(".labour-entry-wrapper");

    labourEntries.forEach((entry) => {
        // Remove existing listeners to avoid duplication
        entry.removeEventListener("mousedown", startLongPress);
        entry.removeEventListener("mouseup", cancelLongPress);
        entry.removeEventListener("mouseleave", cancelLongPress);

        // Attach new listeners
        entry.addEventListener("mousedown", startLongPress);
        entry.addEventListener("mouseup", cancelLongPress);
        entry.addEventListener("mouseleave", cancelLongPress);
    });
}

function startLongPress(e) {
    selectedEntryId = e.currentTarget.getAttribute("data-id"); // Get the unique ID
    longPressTimeout = setTimeout(showBottomMenu, 800); // Show menu after 800ms
}
function cancelLongPress() {
    clearTimeout(longPressTimeout);
}
// Call the function to add listeners
document.getElementById("deleteEntry").addEventListener("click", () => {
    if (selectedEntryId) {
        // Show the delete warning menu
        const deleteWarning = document.getElementById("deleteWarning");
        deleteWarning.classList.add("visible");

        // Handle confirm delete
        document.getElementById("confirmDelete").onclick = () => {
            const entries = getLabourEntries();
            const updatedEntries = entries.filter((entry) => entry.id !== selectedEntryId);

            // Save updated entries back to local storage
            localStorage.setItem("labourEntries", JSON.stringify(updatedEntries));

            // Remove the entry from the UI
            const entryElement = document.querySelector(`[data-id="${selectedEntryId}"]`);
            if (entryElement) {
                entryElement.remove();
            }
            if (updatedEntries.length === 0) {
                placeholder.style.display = "block"; // Show placeholder if no entries
            } else {
                placeholder.style.display = "none"; // Hide placeholder if entries exist
            }

            // Check if no entries are left

            alert("Entry deleted successfully.");
            deleteWarning.classList.remove("visible"); // Hide warning menu
            hideBottomMenu(); // Hide the bottom menu
        };

        // Handle cancel delete
        document.getElementById("cancelDelete").onclick = () => {
            deleteWarning.classList.remove("visible"); // Hide warning menu
        };
    }
});
document.getElementById("editEntry").addEventListener("click", () => {
    alert("Edit Labour functionality not implemented yet.");
    hideBottomMenu(); // Hide the menu after selecting an option
});

document.getElementById("shiftEntry").addEventListener("click", () => {
    alert("Shift Labour functionality not implemented yet.");
    hideBottomMenu(); // Hide the menu after selecting an option
});
// Close bottom menu when clicking outside
document.addEventListener("click", (event) => {
    const bottomMenu = document.getElementById("bottomMenu");
    const clickedInsideMenu = bottomMenu.contains(event.target);
    const clickedEntry = event.target.closest(".labour-entry-wrapper");

    if (!clickedInsideMenu && !clickedEntry) {
        hideBottomMenu();
    }
});
window.getLabourEntries = async function () {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                console.warn("User is not logged in!");
                resolve([]); // Return empty array if not logged in
            } else {
                try {
                    const userLabourCollection = collection(db, `users/${user.uid}/labourEntries`);
                    const querySnapshot = await getDocs(userLabourCollection);

                    const entries = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
                    console.log("Entries fetched:", entries);
                    resolve(entries); // Resolve fetched entries
                } catch (error) {
                    console.error("Error fetching labour entries:", error);
                    reject(error); // Reject on error
                }
            }
        });
    });
};
--User Accounts
CREATE TABLE UserAccounts (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    UserRole VARCHAR(255) NOT NULL,
    Email VARCHAR(255) NOT NULL,
    Password VARCHAR(255) NOT NULL, -- Consider using VARBINARY 
    FirstName VARCHAR(255) NOT NULL,
    LastName VARCHAR(255) NOT NULL,
    PhoneNumber VARCHAR(20),
    ApartmentNumber INT,
    UNIQUE (Email),
    FOREIGN KEY (ApartmentNumber) REFERENCES Apartments(ApartmentNumber)
);

--Apartment Info
CREATE TABLE Apartments (
    ApartmentNumber INT AUTO_INCREMENT PRIMARY KEY,
    Building VARCHAR(255) NOT NULL,
    NumberOfRooms INT NOT NULL
);

CREATE TABLE UserApartments (
    UserID INT NOT NULL,
    ApartmentNumber INT NOT NULL,
    IsPrimaryResident BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (UserID) REFERENCES UserAccounts(UserID),
    FOREIGN KEY (ApartmentNumber) REFERENCES Apartments(ApartmentNumber),
    PRIMARY KEY (UserID, ApartmentNumber)
);


-- Payments Due Table
CREATE TABLE PaymentsDue (
    PaymentDueID INT AUTO_INCREMENT PRIMARY KEY,
    DueDate DATE NOT NULL,
    ApartmentNumber INT NOT NULL,
    PaymentAmount DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (ApartmentNumber) REFERENCES Apartments(ApartmentNumber)
);

-- Payment Methods Table
CREATE TABLE PaymentMethods (
    CardID INT AUTO_INCREMENT PRIMARY KEY,
    NameOnCard VARCHAR(255) NOT NULL,
    Expiry DATE NOT NULL,
    CardNum VARCHAR(19) NOT NULL, 
    CVV VARCHAR(4) NOT NULL,
    CardNickname VARCHAR(255),
    Country VARCHAR(255) NOT NULL,
    City VARCHAR(255) NOT NULL,
    State VARCHAR(255) NOT NULL,
    Zip VARCHAR(10) NOT NULL,
    Address VARCHAR(255) NOT NULL,
    UserID INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES UserAccounts(UserID)
);

-- Messages Table
CREATE TABLE Messages (
    MessageID INT AUTO_INCREMENT PRIMARY KEY,
    SenderUserID INT NOT NULL,
    ReceiverID INT NOT NULL,
    Subject VARCHAR(255),
    Message TEXT NOT NULL,
    TimeStamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ReadStatus BOOLEAN DEFAULT FALSE,
    MessageType VARCHAR(255) NOT NULL,
    FOREIGN KEY (SenderUserID) REFERENCES UserAccounts(UserID),
    FOREIGN KEY (ReceiverID) REFERENCES UserAccounts(UserID)
);

-- Payments Made Table
CREATE TABLE PaymentsMade (
    PaymentMadeID INT AUTO_INCREMENT PRIMARY KEY,
    PaymentDueID INT NOT NULL,
    UserID INT NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    Status VARCHAR(255),
    Date DATETIME NOT NULL,
    Notes TEXT,
    FOREIGN KEY (PaymentDueID) REFERENCES PaymentsDue(PaymentDueID),
    FOREIGN KEY (UserID) REFERENCES UserAccounts(UserID)
);

-- User Documents Table
CREATE TABLE UserDocuments (
    DocumentID INT AUTO_INCREMENT PRIMARY KEY,
    DocumentType VARCHAR(255) NOT NULL,
    DocumentReference TEXT NOT NULL,
    MimeType VARCHAR(50),
    UserID INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES UserAccounts(UserID)
);





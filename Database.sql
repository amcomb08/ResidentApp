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

CREATE TABLE ResetToken (
    Email VARCHAR(255) NOT NULL,
    ResetToken VARCHAR(255) NOT NULL,
    PRIMARY KEY (Email),
    FOREIGN KEY (Email) REFERENCES UserAccounts(Email)
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
    Expiry VARCHAR(10) NOT NULL,
    CardNum VARCHAR(19) NOT NULL, 
    CVV VARCHAR(4) NOT NULL,
    CardNickname VARCHAR(255) NOT NULL,
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
    ApartmentNumber INT NOT NULL,
    UserID INT NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    Status VARCHAR(255),
    Date DATETIME NOT NULL,
    Notes TEXT,
    NameOnCard VARCHAR(255) NOT NULL,
    CardNum VARCHAR(19) NOT NULL,
    FOREIGN KEY (ApartmentNumber) REFERENCES Apartments(ApartmentNumber), 
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

CREATE TABLE Amenities (
    AmenityID INT AUTO_INCREMENT PRIMARY KEY,
    AmenityName VARCHAR(255) NOT NULL,
    Description TEXT,
    CONSTRAINT UC_AmenityName UNIQUE (AmenityName)
);

CREATE TABLE AmenitySchedules (
    ScheduleID INT AUTO_INCREMENT PRIMARY KEY,
    AmenityID INT,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Date DATE NOT NULL,
    FOREIGN KEY (AmenityID) REFERENCES Amenities(AmenityID)
);

CREATE TABLE Reservations (
    ReservationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    ScheduleID INT,
    ReservationTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('confirmed', 'cancelled') NOT NULL,
    FOREIGN KEY (UserID) REFERENCES UserAccounts(UserID),
    FOREIGN KEY (ScheduleID) REFERENCES AmenitySchedules(ScheduleID),
    UNIQUE KEY unique_reservation (UserID, ScheduleID)
);



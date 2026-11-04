-- Run in a fresh MySQL development instance; this script does not drop existing objects.
CREATE DATABASE IF NOT EXISTS disaster_management;
USE disaster_management;

CREATE TABLE Disaster (
    disaster_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    disaster_type ENUM('Flood','Cyclone','Earthquake','Fire','Landslide','Other') NOT NULL,
    severity ENUM('Low','Moderate','High','Critical') NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    status ENUM('Reported','Active','Monitoring','Closed') NOT NULL DEFAULT 'Reported',
    description TEXT,
    CHECK (end_time IS NULL OR end_time >= start_time)
) ENGINE=InnoDB;

CREATE TABLE Location (
    location_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    UNIQUE (name, district, state)
) ENGINE=InnoDB;

CREATE TABLE AffectedArea (
    disaster_id INT NOT NULL,
    location_id INT NOT NULL,
    people_affected INT NOT NULL DEFAULT 0,
    impact_notes VARCHAR(500),
    PRIMARY KEY (disaster_id, location_id),
    CHECK (people_affected >= 0),
    FOREIGN KEY (disaster_id) REFERENCES Disaster(disaster_id),
    FOREIGN KEY (location_id) REFERENCES Location(location_id)
) ENGINE=InnoDB;

CREATE TABLE ReliefCamp (
    camp_id INT PRIMARY KEY AUTO_INCREMENT,
    disaster_id INT NOT NULL,
    location_id INT NOT NULL,
    name VARCHAR(120) NOT NULL,
    capacity INT NOT NULL,
    status ENUM('Planned','Open','Full','Closed') NOT NULL DEFAULT 'Planned',
    UNIQUE (disaster_id, name),
    CHECK (capacity > 0),
    FOREIGN KEY (disaster_id) REFERENCES Disaster(disaster_id),
    FOREIGN KEY (location_id) REFERENCES Location(location_id)
) ENGINE=InnoDB;

CREATE TABLE Resource (
    resource_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(60) NOT NULL,
    unit VARCHAR(30) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE CampStock (
    camp_id INT NOT NULL,
    resource_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    PRIMARY KEY (camp_id, resource_id),
    CHECK (quantity >= 0),
    FOREIGN KEY (camp_id) REFERENCES ReliefCamp(camp_id),
    FOREIGN KEY (resource_id) REFERENCES Resource(resource_id)
) ENGINE=InnoDB;

CREATE TABLE AidRequest (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    disaster_id INT NOT NULL,
    location_id INT NOT NULL,
    resource_id INT NOT NULL,
    quantity_requested INT NOT NULL,
    priority ENUM('Low','Normal','High','Urgent') NOT NULL DEFAULT 'Normal',
    status ENUM('Open','Partially Fulfilled','Fulfilled','Cancelled') NOT NULL DEFAULT 'Open',
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (quantity_requested > 0),
    FOREIGN KEY (disaster_id) REFERENCES Disaster(disaster_id),
    FOREIGN KEY (location_id) REFERENCES Location(location_id),
    FOREIGN KEY (resource_id) REFERENCES Resource(resource_id),
    INDEX idx_request_status_priority (status, priority)
) ENGINE=InnoDB;

CREATE TABLE Allocation (
    allocation_id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    camp_id INT NOT NULL,
    resource_id INT NOT NULL,
    quantity_allocated INT NOT NULL,
    status ENUM('Prepared','Dispatched','Delivered','Cancelled') NOT NULL DEFAULT 'Prepared',
    allocated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (quantity_allocated > 0),
    FOREIGN KEY (request_id) REFERENCES AidRequest(request_id),
    FOREIGN KEY (camp_id, resource_id) REFERENCES CampStock(camp_id, resource_id),
    INDEX idx_allocation_request (request_id)
) ENGINE=InnoDB;

CREATE TABLE Volunteer (
    volunteer_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL UNIQUE,
    skill VARCHAR(100),
    availability_status ENUM('Available','Assigned','Unavailable') NOT NULL DEFAULT 'Available'
) ENGINE=InnoDB;

CREATE TABLE VolunteerAssignment (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    volunteer_id INT NOT NULL,
    disaster_id INT NOT NULL,
    camp_id INT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Assigned','Completed','Cancelled') NOT NULL DEFAULT 'Assigned',
    FOREIGN KEY (volunteer_id) REFERENCES Volunteer(volunteer_id),
    FOREIGN KEY (disaster_id) REFERENCES Disaster(disaster_id),
    FOREIGN KEY (camp_id) REFERENCES ReliefCamp(camp_id),
    INDEX idx_assignment_disaster_status (disaster_id, status)
) ENGINE=InnoDB;

INSERT INTO Disaster (name, disaster_type, severity, start_time, status, description)
VALUES ('River Response Demo', 'Flood', 'High', '2026-08-14 06:00:00', 'Active',
        'Fictional sample incident for database demonstration');

INSERT INTO Location (name, district, state, latitude, longitude) VALUES
('North Ward', 'Demo District', 'Karnataka', 12.900000, 77.600000),
('East Ward', 'Demo District', 'Karnataka', 12.910000, 77.620000);

INSERT INTO AffectedArea (disaster_id, location_id, people_affected, impact_notes) VALUES
(1, 1, 420, 'Fictional sample impact record'),
(1, 2, 180, 'Fictional sample impact record');

INSERT INTO ReliefCamp (disaster_id, location_id, name, capacity, status) VALUES
(1, 1, 'North Relief Camp', 600, 'Open'),
(1, 2, 'East Relief Camp', 300, 'Open');

INSERT INTO Resource (name, category, unit) VALUES
('Drinking water', 'Essential', 'litre'),
('Food packet', 'Food', 'packet'),
('Blanket', 'Shelter', 'piece');

INSERT INTO CampStock (camp_id, resource_id, quantity) VALUES
(1, 1, 1200), (1, 2, 500), (1, 3, 120),
(2, 1, 600), (2, 2, 250), (2, 3, 60);

INSERT INTO AidRequest (disaster_id, location_id, resource_id, quantity_requested, priority) VALUES
(1, 2, 1, 300, 'Urgent'),
(1, 1, 3, 80, 'High');

INSERT INTO Volunteer (name, phone, skill) VALUES
('Sample Volunteer One', '+91-9000000001', 'First aid'),
('Sample Volunteer Two', '+91-9000000002', 'Logistics');

INSERT INTO VolunteerAssignment (volunteer_id, disaster_id, camp_id) VALUES
(1, 1, 1), (2, 1, 2);

DELIMITER //
CREATE PROCEDURE AllocateAid(IN p_request_id INT, IN p_camp_id INT, IN p_quantity INT)
BEGIN
    DECLARE v_disaster_id INT;
    DECLARE v_resource_id INT;
    DECLARE v_requested INT;
    DECLARE v_status VARCHAR(30);
    DECLARE v_stock INT;
    DECLARE v_allocated INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_quantity <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be positive';
    END IF;
    START TRANSACTION;
    SELECT disaster_id, resource_id, quantity_requested, status
      INTO v_disaster_id, v_resource_id, v_requested, v_status
    FROM AidRequest WHERE request_id = p_request_id FOR UPDATE;
    IF v_status NOT IN ('Open', 'Partially Fulfilled') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Request is not open';
    END IF;
    SELECT COALESCE(SUM(quantity_allocated), 0) INTO v_allocated
    FROM Allocation WHERE request_id = p_request_id AND status <> 'Cancelled';
    IF v_allocated + p_quantity > v_requested THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity exceeds remaining request';
    END IF;
    SELECT cs.quantity INTO v_stock
    FROM CampStock AS cs JOIN ReliefCamp AS c ON c.camp_id = cs.camp_id
    WHERE cs.camp_id = p_camp_id AND cs.resource_id = v_resource_id
      AND c.disaster_id = v_disaster_id FOR UPDATE;
    IF v_stock < p_quantity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient camp stock';
    END IF;
    INSERT INTO Allocation (request_id, camp_id, resource_id, quantity_allocated, status)
    VALUES (p_request_id, p_camp_id, v_resource_id, p_quantity, 'Prepared');
    SELECT COALESCE(SUM(quantity_allocated), 0) INTO v_allocated
    FROM Allocation WHERE request_id = p_request_id AND status <> 'Cancelled';
    UPDATE AidRequest SET status = CASE WHEN v_allocated >= v_requested
        THEN 'Fulfilled' ELSE 'Partially Fulfilled' END WHERE request_id = p_request_id;
    COMMIT;
END//

CREATE FUNCTION TotalPeopleAffected(p_disaster_id INT)
RETURNS INT READS SQL DATA
BEGIN
    DECLARE v_total INT;
    SELECT COALESCE(SUM(people_affected), 0) INTO v_total
    FROM AffectedArea WHERE disaster_id = p_disaster_id;
    RETURN v_total;
END//

CREATE TRIGGER BeforeAllocationInsert BEFORE INSERT ON Allocation
FOR EACH ROW
BEGIN
    DECLARE v_stock INT DEFAULT NULL;
    SELECT quantity INTO v_stock FROM CampStock
    WHERE camp_id = NEW.camp_id AND resource_id = NEW.resource_id FOR UPDATE;
    IF v_stock IS NULL OR v_stock < NEW.quantity_allocated THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient or missing camp stock';
    END IF;
END//

CREATE TRIGGER AfterAllocationInsert AFTER INSERT ON Allocation
FOR EACH ROW
BEGIN
    IF NEW.status <> 'Cancelled' THEN
        UPDATE CampStock SET quantity = quantity - NEW.quantity_allocated
        WHERE camp_id = NEW.camp_id AND resource_id = NEW.resource_id;
    END IF;
END//

CREATE TRIGGER AfterAllocationCancel AFTER UPDATE ON Allocation
FOR EACH ROW
BEGIN
    IF OLD.status <> 'Cancelled' AND NEW.status = 'Cancelled' THEN
        UPDATE CampStock SET quantity = quantity + OLD.quantity_allocated
        WHERE camp_id = OLD.camp_id AND resource_id = OLD.resource_id;
    END IF;
END//
DELIMITER ;

SHOW TABLES;
SELECT COUNT(*) AS table_count FROM information_schema.tables
WHERE table_schema = 'disaster_management';
SELECT disaster_id, name, disaster_type, severity, status FROM Disaster;
SELECT camp_id, name, capacity, status FROM ReliefCamp;
SELECT camp_id, resource_id, quantity FROM CampStock ORDER BY camp_id, resource_id;
SELECT d.disaster_id, d.name, COUNT(a.location_id) AS affected_locations,
       SUM(a.people_affected) AS people_affected
FROM Disaster AS d LEFT JOIN AffectedArea AS a ON a.disaster_id = d.disaster_id
GROUP BY d.disaster_id, d.name;
SELECT TotalPeopleAffected(1) AS people_affected;
CALL AllocateAid(1, 1, 100);
SELECT request_id, status FROM AidRequest WHERE request_id = 1;
SELECT camp_id, resource_id, quantity FROM CampStock WHERE camp_id = 1 AND resource_id = 1;
UPDATE Allocation SET status = 'Cancelled' WHERE allocation_id = 1;
UPDATE AidRequest SET status = 'Open' WHERE request_id = 1;
SELECT camp_id, resource_id, quantity FROM CampStock WHERE camp_id = 1 AND resource_id = 1;
SELECT ar.request_id, ar.disaster_id, ar.location_id, ar.resource_id,
       ar.quantity_requested, ar.priority
FROM AidRequest AS ar
WHERE ar.status IN ('Open', 'Partially Fulfilled')
  AND NOT EXISTS (
      SELECT 1 FROM ReliefCamp AS c JOIN CampStock AS cs ON cs.camp_id = c.camp_id
      WHERE c.disaster_id = ar.disaster_id AND cs.resource_id = ar.resource_id
        AND cs.quantity >= ar.quantity_requested
  );
SELECT resource_id, name, category, unit FROM Resource
WHERE resource_id IN (SELECT resource_id FROM AidRequest
                      WHERE priority = 'Urgent'
                        AND status IN ('Open', 'Partially Fulfilled'));

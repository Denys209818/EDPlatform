CREATE TABLE tblUsers (
  id UUID PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  middle_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_phone UNIQUE (phone_number),
  CONSTRAINT chk_users_email CHECK (email LIKE '%_@_%._%'),
  CONSTRAINT chk_users_phone CHECK (phone_number IS NULL OR phone_number ~ '^\+[0-9]{10,15}$')
);

CREATE TABLE tblTests (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','published','archived')),
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', title || ' ' || description)) STORED,
  created_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  CONSTRAINT fk_UserTest
    FOREIGN KEY (created_by)
    REFERENCES tblUsers(id)
);

CREATE TABLE tblTasks (
  id UUID PRIMARY KEY,
  Condition TEXT NOT NULL,
  test_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  CONSTRAINT fk_Test
    FOREIGN KEY (test_id)
    REFERENCES tblTests(id)
);

CREATE TABLE tblTaskAnswer (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  task_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  CONSTRAINT fk_Task
    FOREIGN KEY (task_id)
    REFERENCES tblTasks(id)
);

CREATE TABLE tblTestUsers (
  status TEXT NOT NULL CHECK (status IN ('in_progress','completed','failed')),
  attempt INT NOT NULL DEFAULT 1,
  test_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  CONSTRAINT pk_TestUsers
    PRIMARY KEY (test_id, user_id),

  CONSTRAINT fk_Test
    FOREIGN KEY (test_id)
    REFERENCES tblTests(id),

  CONSTRAINT fk_User
    FOREIGN KEY (user_id)
    REFERENCES tblUsers(id)
);

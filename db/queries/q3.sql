SELECT id, first_name, last_name, email
FROM tblUsers
WHERE lower(email) = lower('User5000@Example.com')
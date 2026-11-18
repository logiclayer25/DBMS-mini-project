# ReliefOps disaster response dashboard
ReliefOps provides a centralized dashboard for managing disaster response activities, including incidents, relief camps, aid requests, volunteers, and available resources.

The project demonstrates the use of database management concepts through a disaster management scenario, with a focus on organized data handling and efficient access to information.

Next.js demo frontend for the DBMS mini project. It uses fictional sample data aligned with `disaster_management_demo.sql`.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

The dashboard includes overview metrics, incident/camp/request/volunteer/resource views, aid-request search and filters, and a create-request form. The form updates page state for the current session only. The frontend does not connect to MySQL or MongoDB yet, so it is a UI prototype rather than a persistent full-stack application.

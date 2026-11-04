# ReliefOps disaster response dashboard

Next.js demo frontend for the DBMS mini project. It uses fictional sample data aligned with `disaster_management_demo.sql`.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

The dashboard includes overview metrics, incident/camp/request/volunteer/resource views, aid-request search and filters, and a create-request form. The form updates page state for the current session only. The frontend does not connect to MySQL or MongoDB yet, so it is a UI prototype rather than a persistent full-stack application.

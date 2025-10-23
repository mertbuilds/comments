import { useState } from "react";
import "./App.css";

interface Customer {
  CustomerId: number;
  CompanyName: string;
  ContactName: string;
}

function App() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);

  return (
    <>
      <div className="card">
        <button
          onClick={() => {
            fetch("/api/beverages")
              .then((res) => res.json() as Promise<Customer[]>)
              .then((data) => setCustomers(data));
          }}
          aria-label="get name"
        >
          Get customers from Bs Beverages
        </button>

        {customers ? (
          <ol>
            {customers.map((customer) => (
              <li style={{ textAlign: "left" }} key={customer.CustomerId}>
                {customer.ContactName}, {customer.CompanyName}
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </>
  );
}

export default App;

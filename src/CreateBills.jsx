import { useState } from "react";
import { createBill } from "./firebase";

export default function CreateBill() {
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [members, setMembers] = useState([{ name: "" }]);

    const addMember = () => {
        setMembers([...members, { name: "" }]);
    };

    const updateMember = (i, value) => {
        const updated = [...members];
        updated[i].name = value;
        setMembers(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const total = Number(amount);
        const split = total / members.length;

        const billData = {
            title,
            totalAmount: total,
            category: "food",
            currency: "INR",
            createdBy: "bhanu",
            splitType: "equal",
            status: "pending",
            createdAt: new Date(),

            members: members.map((m) => ({
                name: m.name,
                owes: split,
                paid: false,
            })),
        };

        await createBill(billData);

        alert("Bill Created 🚀");

        setTitle("");
        setAmount("");
        setMembers([{ name: "" }]);
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Create Bill</h2>

            <form onSubmit={handleSubmit}>
                <input
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <br />

                <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />

                <br />

                <h4>Members</h4>

                {members.map((m, i) => (
                    <input
                        key={i}
                        placeholder="Name"
                        value={m.name}
                        onChange={(e) => updateMember(i, e.target.value)}
                    />
                ))}

                <br />

                <button type="button" onClick={addMember}>
                    + Add Member
                </button>

                <br /><br />

                <button type="submit">Create</button>
            </form>
        </div>
    );
}
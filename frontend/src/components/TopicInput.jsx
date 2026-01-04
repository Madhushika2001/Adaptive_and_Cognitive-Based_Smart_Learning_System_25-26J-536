export default function TopicInput({ setTopic }) {
return (
<input
placeholder="Enter Topic"
onChange={(e) => setTopic(e.target.value)}
/>
);
}
import "./LdifOu.scss";

const LdifOu = (props: { isActive: boolean }) => {
  const { isActive } = props;
  return (
    <div className="ldif-ou-raw raw">
      LDIF OU: <input type="text" placeholder="2024" disabled={!isActive} />{" "}
      <input type="text" placeholder="ou=zo" disabled={!isActive} />
    </div>
  );
};

export default LdifOu;

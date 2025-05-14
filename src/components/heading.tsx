interface HeadingProps {
  title: string;
  meta: string;
}

const Heading = ({ title, meta }: HeadingProps) => {
  return (
    <div className="heading">
      <h2 className="heading__title">{title}</h2>
      <span className="heading__meta">{meta}</span>
    </div>
  );
};

export default Heading;

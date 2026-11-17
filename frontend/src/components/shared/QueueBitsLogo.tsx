export default function QueueBitsLogo({ className }: { className: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}queuebits-logo.png`}
      alt=""
      width={256}
      height={256}
      className={className}
    />
  )
}

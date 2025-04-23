export default function TestPage() {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'red',
      color: 'white',
      padding: '20px',
      zIndex: 9999
    }}>
      TEST PAGE RENDERING
    </div>
  )
}
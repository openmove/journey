 import React from "react"

 const PoweredByOpenmove = ({centered}) => (
  <div className='powered-by-logo' style={centered? {justifyContent:'center'}: {}}>
          Powered by
          <img src='static/images/credits/openmove.png' />
    </div>
)

export default PoweredByOpenmove

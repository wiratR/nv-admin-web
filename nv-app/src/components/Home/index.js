import React, { Component }  from 'react';

import { withAuthorization } from '../Session';
import firebase from 'firebase';

const HomePage = () => (
  <div>
    <h1>Home Page</h1>
    < DeviceStatusForm/>
  </div>
);

// this class for get data from Realt time database
class DeviceStatusForm extends Component  {
  constructor(){
      super();
      this.state = {
        dv_status:[],
        item_id:'',
        device_id:'',
        datetime:'',
        status:''
      }
      this.handleChange = this.handleChange.bind(this)

  }
  componentDidMount(){
    const itemsRef = firebase.database().ref('dv_status');
    itemsRef.on('value',(snapshot) => {
        let dv_status = snapshot.val();
        let newState = [];
        for(let item in dv_status){
          newState.push({
              item_id:item,
              device_id:dv_status[item].device_id,
              datetime:dv_status[item].datetime,
              status:dv_status[item].status
          })
        }
        this.setState({
          dv_status:newState
        })
    })
  }

  handleChange(e){
    this.setState({
      [e.target.name]: e.target.value
    })
  }
  render() {
    return (
      <div className="app">
          <nav class="navbar navbar-light bg-primary">
            <span class="navbar-brand mb-0 h1">Device Status Details</span>
          </nav>
          <div className="container" style={{marginTop:70}}>
              <table className="table table-sm table-bordered">
                    <tr className="thead-dark">
                      <th width="5%">Device</th>
                      <th width="10%">Status</th>
                      <th width="20%">Date time</th>
                    </tr>
                    {
                        this.state.dv_status.map((item) => {
                          return (
                              <tr>
                                <td>{item.device_id}</td>
                                <td>{item.status}</td>
                                <td>{item.datetime}</td>
                               </tr>
                          )
                        })
                    }
                </table>
        </div>
      </div>
    );
  }
}

const condition = authUser => !!authUser;

export default withAuthorization(condition)(HomePage);


import React, { Component }  from 'react';

import { withAuthorization } from '../Session';
import firebase from 'firebase';

const HomePage = () => (
  <div>
    <h1>Home Page</h1>
    < DeviceStatusForm/>
    < LocationForm/>
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
      <div className="device">
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

// this class for edit table 'map_location'
class LocationForm extends Component  {
  
    constructor(){
        super();
        this.state = {
            map_location:[],
            item_id:'',
            loc_code:'',
            loc_name:'',
            loc_x:'',
            loc_y:''
        }

        this.handleChange = this.handleChange.bind(this)
        this.handleUpdate = this.handleUpdate.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)

    }
    componentDidMount(){
      const itemsRef = firebase.database().ref('map_location');
      itemsRef.on('value',(snapshot) => {
          let map_location = snapshot.val();
          let newState = [];
          for(let item in map_location){
            newState.push({
                item_id:item,
                loc_code:map_location[item].loc_code,
                loc_name:map_location[item].loc_name,
                loc_x:map_location[item].loc_x,
                loc_y:map_location[item].loc_y
            })
          }
          this.setState({
            map_location:newState
          })
      })
    }

    handleChange(e){
      this.setState({
        [e.target.name]: e.target.value
      })
    }


    handleSubmit(e){
      e.preventDefault();

      if(this.state.item_id !== ''){
        return this.updateItem();
      }
  
      const itemsRef = firebase.database().ref('map_location')
      const item = {
        loc_code : this.state.loc_code,
        loc_name : this.state.loc_name,
        loc_x : this.state.loc_x,
        loc_y : this.state.loc_y
      }
      itemsRef.push(item)
      this.setState({
        item_id:'',
        loc_code:'',
        loc_name:'',
        loc_x:'',
        loc_y:''
      })
  }

  handleUpdate = (item_id = null , loc_code = null , loc_name = null, loc_x = null, loc_y = null) => {
      this.setState({item_id,loc_code,loc_name,loc_x,loc_y})
  }
  
  updateItem(){
      var obj = { loc_code:this.state.loc_code,loc_name:this.state.loc_name,loc_x:this.state.loc_x,loc_y:this.state.loc_y}
      
      const itemsRef = firebase.database().ref('/map_location')
      
      itemsRef.child(this.state.item_id).update(obj);
      
      this.setState({
        item_id:'',
        loc_code:'',
        loc_name:'',
        loc_x:'',
        loc_y:''
      })
  }

  removeItem(itemId){
    const itemsRef = firebase.database().ref('/map_location');
    itemsRef.child(itemId).remove();
  }

  render() {
    return (
      <div className="location">
          <nav class="navbar navbar-light bg-primary">
            <span class="navbar-brand mb-0 h1">Edit location</span>
          </nav>
          <div className="container" style={{marginTop:70}}>
          <form  onSubmit={this.handleSubmit}>
            <div className="row">
                <div className="col-8">
                  <div className="form-row">
                    <div className="col-4">
                      <input type="text" name="loc_code" className="form-control" placeholder="LocationCode" onChange={this.handleChange} value={this.state.loc_code}/>
                    </div>
                    <div className="col-6">
                      <input type="text" name="loc_name" className="form-control" placeholder="Name" onChange={this.handleChange} value={this.state.loc_name}/>
                    </div>
                    <div className="col-4">
                      <input type="text" name="loc_x" className="form-control" placeholder="Latitude" onChange={this.handleChange} value={this.state.loc_x}/>
                    </div>
                    <div className="col-6">
                      <input type="text" name="loc_y" className="form-control" placeholder="Londtitude" onChange={this.handleChange} value={this.state.loc_y}/>
                    </div>
                    <div className="col">
                          <button class="btn btn-primary" > Save</button>
                    </div>
                  </div>
                </div>
            </div>
          </form>
          <hr/>
              <table className="table table-sm table-bordered">
                    <tr className="thead-dark">
                      <th width="10%">location code</th>
                      <th width="10%">Name</th>
                      <th width="10%">Latitude</th>
                      <th width="10%">Londtitude</th>
                      <th width="5%">Edit</th>
                      <th width="5%">Delete</th>
                    </tr>
                    {
                        this.state.map_location.map((item) => {
                          return (
                              <tr>
                                <td>{item.loc_code}</td>
                                <td>{item.loc_name}</td>
                                <td>{item.loc_x}</td>
                                <td>{item.loc_y}</td>
                                <td><button className="btn btn-warning btn-sm" onClick={() => this.handleUpdate(item.item_id,item.loc_code,item.loc_name,item.loc_x,item.loc_y)}>Edit</button></td>
                                <td><button className="btn btn-danger btn-sm" onClick={() => this.removeItem(item.item_id)}>Delete</button></td>
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


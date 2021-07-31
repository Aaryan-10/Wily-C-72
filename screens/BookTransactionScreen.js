import React, {Component} from 'react';
import { Text, View,TouchableOpacity, StyleSheet, TextInput,Image,KeyboardAvoidingView ,ToastAndroid, Alert} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from '../config';

export default class TransactionScreen extends Component {
  constructor(){
    super();
    this.state = {
      hasCameraPermissions : null, //This will tell if the user has granted camera permission to the application
      scanned: false, //> This will tell if the scanning has completed or not
      scannedDate: '',//This will hold the scanned data that we get after scanning     
      buttonState: 'normal', //keeps track if the button has been clicked.
      scannedBookId:'',
      scannedStudentId:'',
      transactionMessage: '',
    }

  }
  //function to request for camera permission
  //this function needs to be asynchronous because it takes time for the user to give camera permission to the application.
  getCameraPermissions = async(id) => {
    const {status} = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
        /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
      hasCameraPermissions : status === 'granted',
      buttonState:id,
      scanned:false,
    })
  }

  //This function automatically receives the type of barcode scanned and the data inside the barcode
  handleBarCodeScanned = async({type, data})=>{
    const{buttonState}=this.state
    if(buttonState==='BookId'){
      this.setState({
        scanned: true,
        scannedBookId: data,
        buttonState: 'normal'
      });
    }
    else if(buttonState==='StudentId'){
      this.setState({
        scanned: true,
        scannedStudentId: data,
        buttonState: 'normal'
      });
    }
    }



  initiateBookIssue = async ()=>{
    //add a transaction
    db.collection("transaction").add({
      'studentId' : this.state.scannedStudentId,
      'bookId' : this.state.scannedBookId,
      'date' : firebase.firestore.Timestamp.now().toDate(),
      'transactionType' : "Issue"
    })

    //change book status
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailability' : false
    })
    //change number of issued books for student
    db.collection("students").doc(this.state.scannedStudentId).update({
      'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(1)
    })

    this.setState({
      scannedStudentId : '',
      scannedBookId: ''
    })
  } 

  initiateBookReturn = async ()=>{
    //add a transaction
    db.collection("transactions").add({
      'studentId' : this.state.scannedStudentId,
      'bookId' : this.state.scannedBookId,
      'date'   : firebase.firestore.Timestamp.now().toDate(),
      'transactionType' : "Return"
    })

    //change book status
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailability' : true
    })

    //change book status
    db.collection("students").doc(this.state.scannedStudentId).update({
      'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(-1)
    })

    this.setState({
      scannedStudentId : '',
      scannedBookId : ''
    })
  }

  
  
  handleTransaction = () => {
    var transactionMessage = null;
    db.collection("books").doc(this.state.scannedBookId).get()
    .then((doc)=>{
      var book = doc.data() //to get all the information stored in the document.
      
      if(book.bookAvailability){
        this.initiateBookIssue();
        transactionMessage = "Book Issued"
        //Alert.alert(transactionMessage)
        ToastAndroid.show(transactionMessage, ToastAndroid.SHORT)
      }
      else{
        this.initiateBookReturn();
        transactionMessage = "Book Returned"
        //Alert.alert(transactionMessage)
        ToastAndroid.show(transactionMessage, ToastAndroid.SHORT)
      }
    })
    this.setState({
      transactionMessage : transactionMessage
    })
  }


  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if (buttonState !== 'normal' && hasCameraPermissions){
      return(
        //The BarCodeScanner component automatically starts scanning using the Camera. It has a prop called onBarCodeScanned which can call a
        //function to handle data received after scanning. We want to call this function handleBarCodeScanned only when scanned is false
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }

    else if (buttonState === "normal"){
      return(
        <KeyboardAvoidingView  style={styles.container} behavior="padding" enabled>
            <View>
              <Image
                source={require("../assets/booklogo.jpg")}
                style={{width:200, height: 200}}/>
              <Text style={{textAlign: 'center', fontSize: 30}}>Wily</Text>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Book Id"
              onChangeText={text =>this.setState({scannedBookId:text})}
              value={this.state.scannedBookId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("BookId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Student Id"
              onChangeText ={text => this.setState({scannedStudentId:text})}
              value={this.state.scannedStudentId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("StudentId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={async()=>{
                var transactionMessage = this.handleTransaction();
                this.setState(
                  {scannedBookId:'',
                   scannedStudentId:''})
              }}>
          <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
      );
    }
  }
  }
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  displayText:{
    fontSize: 15,
    textDecorationLine: 'underline'
  },
  scanButton:{
    backgroundColor: '#2196F3',
    padding: 10,
    margin: 10
  },
  buttonText:{
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10
  },
  inputView:{
    flexDirection: 'row',
    margin: 20
  },
  inputBox:{
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20
  },
  scanButton:{
    backgroundColor: '#66BB6A',
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0
  },
  submitButton:{
    backgroundColor:'#fbc02d',
    width:100,
    height:50
  },
  submitButtonText: {
    padding:10,
    textAlign:'center',
    fontSize:20,
    fontWeight:'bold',
    color:'white'
  }
})


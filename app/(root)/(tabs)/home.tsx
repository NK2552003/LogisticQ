import { useUser } from "@clerk/clerk-expo";
import { Text, View } from "react-native";

const Home = () => {
    const {user} = useUser();
    return(
        <View>
            <Text>Home Screen</Text>
            {user && <Text>Welcome, {user.firstName}!</Text>}
        </View>
    );
}

export default Home;
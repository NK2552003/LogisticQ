import { Text, View } from 'react-native';
const Header = () =>{
    return(
      <View className="flex-row items-center justify-center px-4 py-4 absolute w-full top-20">
        <View className="flex-row items-center justify-center left-7">
          <Text className="text-2xl font-bold text-gray-900">L</Text>
          <View className="w-8 h-8 bg-yellow-400 rounded-full mx-1 items-center justify-center">
            <View className="w-4 h-4 bg-white rounded-full" />
          </View>
          <Text className="text-2xl font-bold text-gray-900">gistic</Text>
          <View className="w-8 h-8 bg-yellow-400 rounded-full mx-1 items-center justify-center">
            <Text className="text-xl font-bold text-white">Q</Text>
          </View>
        </View>
        <View className="w-10" />
      </View>
    );
}

export default Header;